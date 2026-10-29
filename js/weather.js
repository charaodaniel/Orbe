import { loadValue, saveValue } from "./storage.js";

const isLocation = (value) =>
  value === null ||
  (value &&
    typeof value.name === "string" &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude));
const isWeatherData = (value) =>
  value === null ||
  (value &&
    typeof value.city === "string" &&
    Number.isFinite(value.temperature) &&
    Number.isFinite(value.apparent) &&
    Number.isFinite(value.humidity) &&
    Number.isFinite(value.weatherCode) &&
    Number.isFinite(value.high) &&
    Number.isFinite(value.low) &&
    ["celsius", "fahrenheit"].includes(value.unit) &&
    typeof value.updatedAt === "string");

const weatherDescriptions = new Map([
  [0, "Céu limpo"],
  [1, "Predominantemente limpo"],
  [2, "Parcialmente nublado"],
  [3, "Nublado"],
  [45, "Nevoeiro"],
  [48, "Nevoeiro com geada"],
  [51, "Garoa leve"],
  [53, "Garoa moderada"],
  [55, "Garoa intensa"],
  [61, "Chuva leve"],
  [63, "Chuva moderada"],
  [65, "Chuva intensa"],
  [66, "Chuva congelante leve"],
  [67, "Chuva congelante intensa"],
  [71, "Neve leve"],
  [73, "Neve moderada"],
  [75, "Neve intensa"],
  [77, "Grãos de neve"],
  [80, "Pancadas de chuva leves"],
  [81, "Pancadas de chuva moderadas"],
  [82, "Pancadas de chuva intensas"],
  [85, "Pancadas de neve leves"],
  [86, "Pancadas de neve intensas"],
  [95, "Trovoada"],
  [96, "Trovoada com granizo leve"],
  [99, "Trovoada com granizo intenso"],
]);

function placeLabel(place) {
  return [place.name, place.admin1, place.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ");
}

function formatTemperature(value, unit) {
  return `${Math.round(value)}°${unit === "fahrenheit" ? "F" : "C"}`;
}

function displayTemperature(value, sourceUnit, targetUnit) {
  if (sourceUnit === targetUnit) return value;
  return sourceUnit === "celsius"
    ? (value * 9) / 5 + 32
    : ((value - 32) * 5) / 9;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const weatherWidget = {
  id: "weather",
  mount({ preferences }) {
    const form = document.getElementById("weatherSearch");
    const input = document.getElementById("weatherCity");
    const results = document.getElementById("weatherResults");
    const select = document.getElementById("weatherLocations");
    const chooseButton = document.getElementById("weatherChoose");
    const status = document.getElementById("weatherStatus");
    const locationState = loadValue("weather-location", null, isLocation);
    const dataState = loadValue("weather-data", null, isWeatherData);
    let selectedLocation = locationState.value;
    let places = [];
    let lastWeather = dataState.value;
    let activeRequest = null;

    const setStatus = (message) => {
      status.textContent = message;
    };

    const renderWeather = (data) => {
      const city = document.getElementById("weatherCityName");
      const temperature = document.getElementById("weatherTemperature");
      const condition = document.getElementById("weatherCondition");
      const range = document.getElementById("weatherRange");
      const details = document.getElementById("weatherDetails");
      const updated = document.getElementById("weatherUpdated");
      const icon = document.getElementById("weatherIcon");

      if (!data) {
        city.textContent = selectedLocation
          ? placeLabel(selectedLocation)
          : "Selecione uma cidade";
        temperature.textContent = "--°";
        condition.textContent = "Consulte a previsão online";
        range.textContent = "Máx. --° · Mín. --°";
        details.textContent = "";
        updated.textContent = "";
        icon.setAttribute("data-lucide", "cloud-sun");
        window.lucide?.createIcons();
        return;
      }

      city.textContent = data.city;
      const unit = preferences.temperatureUnit;
      const formatDisplay = (value) =>
        formatTemperature(displayTemperature(value, data.unit, unit), unit);
      temperature.textContent = formatDisplay(data.temperature);
      condition.textContent =
        weatherDescriptions.get(data.weatherCode) ?? "Condição não informada";
      range.textContent = `Máx. ${formatDisplay(data.high)} · Mín. ${formatDisplay(data.low)}`;
      details.textContent = `Sensação ${formatDisplay(data.apparent)} · Umidade ${data.humidity}%`;
      updated.textContent = `Atualizado às ${formatTime(data.updatedAt)}`;
      icon.setAttribute(
        "data-lucide",
        data.weatherCode >= 95
          ? "cloud-lightning"
          : data.weatherCode >= 51
            ? "cloud-rain"
            : data.weatherCode >= 45
              ? "cloud-fog"
              : data.weatherCode <= 1
                ? "sun"
                : "cloud-sun",
      );
      window.lucide?.createIcons();
    };

    const loadForecast = async (location) => {
      activeRequest?.abort();
      activeRequest = new AbortController();
      selectedLocation = location;
      try {
        saveValue("weather-location", location, isLocation);
      } catch {
        setStatus(
          "Cidade selecionada, mas não foi possível salvá-la neste navegador.",
        );
      }
      setStatus(`Buscando previsão para ${placeLabel(location)}...`);
      try {
        const unit = preferences.temperatureUnit;
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code",
          daily: "temperature_2m_max,temperature_2m_min",
          timezone: "auto",
          forecast_days: "1",
          ...(unit === "fahrenheit" ? { temperature_unit: "fahrenheit" } : {}),
        });
        const response = await fetch(url, {
          signal: activeRequest.signal,
        });
        if (!response.ok)
          throw new Error("Não foi possível consultar a previsão.");
        const forecast = await response.json();
        const data = {
          city: placeLabel(location),
          temperature: forecast.current.temperature_2m,
          apparent: forecast.current.apparent_temperature,
          humidity: forecast.current.relative_humidity_2m,
          weatherCode: forecast.current.weather_code,
          high: forecast.daily.temperature_2m_max[0],
          low: forecast.daily.temperature_2m_min[0],
          unit,
          updatedAt: forecast.current.time,
        };
        if (!isWeatherData(data))
          throw new Error("A resposta da previsão é inválida.");
        lastWeather = data;
        renderWeather(lastWeather);
        try {
          saveValue("weather-data", data, isWeatherData);
          setStatus("");
        } catch {
          setStatus(
            "Previsão atualizada, mas não foi possível salvá-la neste navegador.",
          );
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        setStatus(
          lastWeather
            ? "Não foi possível atualizar. Exibindo a última previsão salva."
            : "Não foi possível consultar a previsão. Verifique a conexão e tente novamente.",
        );
      }
    };

    const searchPlaces = async (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) {
        setStatus("Digite o nome de uma cidade.");
        input.focus();
        return;
      }

      setStatus("Buscando cidades...");
      results.hidden = true;
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.search = new URLSearchParams({
          name: query,
          count: "8",
          language: "pt",
          format: "json",
        });
        const response = await fetch(url);
        if (!response.ok) throw new Error("Não foi possível buscar cidades.");
        const result = await response.json();
        places = result.results ?? [];
        if (!places.length) {
          setStatus("Nenhuma cidade encontrada com esse nome.");
          return;
        }
        select.replaceChildren();
        places.forEach((place, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = placeLabel(place);
          select.append(option);
        });
        results.hidden = false;
        setStatus(`${places.length} cidade(s) encontrada(s). Selecione uma.`);
      } catch {
        setStatus("Não foi possível buscar cidades. Verifique a conexão.");
      }
    };

    const choosePlace = () => {
      const place = places[Number(select.value)];
      if (!place) return;
      const location = {
        name: place.name,
        admin1: place.admin1 ?? "",
        country: place.country ?? "",
        latitude: place.latitude,
        longitude: place.longitude,
      };
      results.hidden = true;
      input.value = placeLabel(location);
      loadForecast(location);
    };

    const onPreferencesChange = () => {
      if (!selectedLocation) return;
      if (lastWeather) renderWeather(lastWeather);
      loadForecast(selectedLocation);
    };
    form.addEventListener("submit", searchPlaces);
    chooseButton.addEventListener("click", choosePlace);
    document.addEventListener("orbe:preferences-change", onPreferencesChange);
    input.value = selectedLocation ? placeLabel(selectedLocation) : "";
    renderWeather(lastWeather);
    if (dataState.warning || locationState.warning) {
      setStatus("Não foi possível restaurar todos os dados de clima salvos.");
    } else if (lastWeather) {
      setStatus("Exibindo a última previsão salva; atualizando...");
    }
    if (selectedLocation) loadForecast(selectedLocation);

    return () => {
      activeRequest?.abort();
      form.removeEventListener("submit", searchPlaces);
      chooseButton.removeEventListener("click", choosePlace);
      document.removeEventListener(
        "orbe:preferences-change",
        onPreferencesChange,
      );
    };
  },
};
