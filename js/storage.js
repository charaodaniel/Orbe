const STORAGE_PREFIX = "orbe:";

function parseStoredValue(raw, validate) {
  const value = JSON.parse(raw);
  if (!validate(value)) throw new TypeError("Formato de dados inválido.");
  return value;
}

export function loadValue(
  name,
  fallback,
  validate = () => true,
  legacyKeys = [],
) {
  const key = `${STORAGE_PREFIX}${name}`;
  let warning = "";

  try {
    const currentValue = localStorage.getItem(key);
    if (currentValue !== null) {
      try {
        return {
          value: parseStoredValue(currentValue, validate),
          warning,
          found: true,
        };
      } catch {
        warning =
          "Os dados salvos estavam inválidos; valores padrão foram carregados.";
      }
    }

    for (const legacyKey of legacyKeys) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue === null) continue;

      try {
        const value = parseStoredValue(legacyValue, validate);
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return {
            value,
            warning:
              "Dados existentes foram migrados; a cópia anterior foi preservada.",
            found: true,
          };
        } catch {
          return {
            value,
            warning:
              "Dados antigos carregados, mas não foi possível concluir a migração.",
            found: true,
          };
        }
      } catch {
        warning =
          "Dados antigos inválidos foram ignorados; valores padrão foram carregados.";
      }
    }
  } catch {
    return {
      value: fallback,
      warning:
        "O armazenamento local está indisponível; alterações podem não persistir.",
      found: false,
    };
  }

  return { value: fallback, warning, found: false };
}

export function saveValue(name, value, validate = () => true) {
  if (!validate(value))
    throw new TypeError("Os dados não passaram na validação.");

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(value));
  } catch {
    throw new Error(
      "Não foi possível salvar. Verifique o espaço e as permissões do navegador.",
    );
  }
}
