"use strict";

const crypto = require("node:crypto");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = 4317;
const GTK_LAUNCH_PATH = ["/usr/bin/gtk-launch", "/bin/gtk-launch"].find(
  (candidate) => {
    try {
      return fsSync.statSync(candidate).isFile();
    } catch {
      return false;
    }
  },
) || "/usr/bin/gtk-launch";
const MAX_BODY_BYTES = 4096;
const MAX_APPS = 1000;
const MAX_DIRECTORY_DEPTH = 4;
const APP_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,254}$/;
const ICON_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/;
const BLOCKED_EXECUTABLES = new Set([
  "ash",
  "bash",
  "busybox",
  "csh",
  "dash",
  "doas",
  "env",
  "fish",
  "ksh",
  "node",
  "perl",
  "php",
  "pkexec",
  "python",
  "python2",
  "python3",
  "ruby",
  "sh",
  "sudo",
  "tcsh",
  "zsh",
]);
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

function getAllowedOrigins(value = process.env.ORBE_ALLOWED_ORIGINS) {
  const configured = value
    ? value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : DEFAULT_ORIGINS;

  for (const origin of configured) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new TypeError(`Invalid allowed origin: ${origin}`);
    }
    if (
      parsed.origin !== origin ||
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      (parsed.protocol === "http:" && !isLoopbackHostname(parsed.hostname))
    ) {
      throw new TypeError(`Unsafe allowed origin: ${origin}`);
    }
  }
  return new Set(configured);
}

function isLoopbackHostname(hostname) {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
    hostname.toLowerCase(),
  );
}

function isLoopbackAddress(address = "") {
  return (
    address === "::1" ||
    address === "127.0.0.1" ||
    address.startsWith("127.") ||
    address.startsWith("::ffff:127.")
  );
}

function getApplicationDirectories(environment = process.env) {
  const configuredHome = environment.XDG_DATA_HOME;
  const dataHome =
    configuredHome && path.isAbsolute(configuredHome)
      ? configuredHome
      : path.join(os.homedir(), ".local", "share");
  const dataDirectories = (environment.XDG_DATA_DIRS || "/usr/local/share:/usr/share")
    .split(":")
    .filter((directory) => path.isAbsolute(directory));
  return [
    path.join(dataHome, "applications"),
    ...dataDirectories.map((directory) => path.join(directory, "applications")),
  ];
}

function getIconDirectories(environment = process.env) {
  const configuredHome = environment.XDG_DATA_HOME;
  const dataHome =
    configuredHome && path.isAbsolute(configuredHome)
      ? configuredHome
      : path.join(os.homedir(), ".local", "share");
  const dataDirectories = (environment.XDG_DATA_DIRS || "/usr/local/share:/usr/share")
    .split(":")
    .filter((directory) => path.isAbsolute(directory));
  return [
    path.join(dataHome, "icons", "hicolor"),
    ...dataDirectories.map((directory) =>
      path.join(directory, "icons", "hicolor"),
    ),
    "/usr/share/pixmaps",
  ];
}

function getIconName(value) {
  if (!value) return "";
  const basename = path.basename(value).replace(/\.(svg|png|xpm)$/i, "");
  return ICON_ID_PATTERN.test(basename) ? basename : "";
}

async function readApplicationIcon(icon, directories = getIconDirectories()) {
  if (!ICON_ID_PATTERN.test(icon)) return null;
  const themedSizes = [
    "scalable/apps",
    "256x256/apps",
    "192x192/apps",
    "128x128/apps",
    "96x96/apps",
    "64x64/apps",
    "48x48/apps",
    "32x32/apps",
    "24x24/apps",
    "22x22/apps",
    "16x16/apps",
    "",
  ];
  const extensions = ["svg", "png", "xpm"];

  for (const directory of directories) {
    let trustedRoot;
    try {
      trustedRoot = await fs.realpath(directory);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EACCES") continue;
      throw error;
    }

    for (const size of themedSizes) {
      for (const extension of extensions) {
        const candidate = path.join(
          directory,
          size,
          `${icon}.${extension}`,
        );
        try {
          const realPath = await fs.realpath(candidate);
          if (!realPath.startsWith(`${trustedRoot}${path.sep}`)) continue;
          const stats = await fs.stat(realPath);
          if (!stats.isFile() || stats.size > 2 * 1024 * 1024) continue;
          const file = await fs.readFile(realPath);
          return {
            body: file,
            contentType:
              extension === "svg"
                ? "image/svg+xml"
                : extension === "png"
                  ? "image/png"
                  : "image/x-xpixmap",
          };
        } catch (error) {
          if (error.code === "ENOENT" || error.code === "EACCES") continue;
          throw error;
        }
      }
    }
  }
  return null;
}

function decodeDesktopValue(value) {
  return value.replace(/\\([sntr\\])/g, (_match, escaped) => {
    const replacements = {
      s: " ",
      n: "\n",
      t: "\t",
      r: "\r",
      "\\": "\\",
    };
    return replacements[escaped];
  });
}

function tokenizeExec(value) {
  const tokens = [];
  let token = "";
  let quoted = false;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      token += character;
      escaped = false;
    } else if (character === "\\" && quoted) {
      escaped = true;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (/\s/.test(character) && !quoted) {
      if (token) {
        tokens.push(token);
        token = "";
      }
    } else {
      token += character;
    }
  }

  if (quoted || escaped) throw new TypeError("Malformed desktop Exec value.");
  if (token) tokens.push(token);
  if (
    !tokens.length ||
    !tokens[0] ||
    tokens[0].startsWith("-") ||
    /[%\u0000-\u001f\u007f;&|<>`$]/.test(tokens[0]) ||
    (tokens[0].includes("/") &&
      (!tokens[0].startsWith("/") ||
        path.normalize(tokens[0]) !== tokens[0] ||
        tokens[0].split("/").includes(".."))) ||
    BLOCKED_EXECUTABLES.has(path.basename(tokens[0]))
  ) {
    throw new TypeError("Unsafe desktop Exec value.");
  }
  return tokens;
}

function parseDesktopEntry(contents, filename) {
  const desktopId = filename.replace(/\.desktop$/i, "");
  if (!APP_ID_PATTERN.test(desktopId)) {
    throw new TypeError("Invalid desktop application identifier.");
  }

  let inDesktopEntry = false;
  const entry = new Map();
  for (const line of contents.split(/\r?\n/)) {
    if (line.startsWith("[") && line.endsWith("]")) {
      inDesktopEntry = line === "[Desktop Entry]";
      continue;
    }
    if (!inDesktopEntry || !line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator);
    if (!entry.has(key)) entry.set(key, line.slice(separator + 1));
  }

  if (
    entry.get("Type") !== "Application" ||
    entry.get("Hidden") === "true" ||
    entry.get("NoDisplay") === "true"
  ) {
    return null;
  }

  const name = decodeDesktopValue(entry.get("Name") || "").trim();
  const exec = entry.get("Exec");
  if (!name || name.length > 200 || !exec || exec.length > 2048) {
    throw new TypeError("Incomplete desktop application entry.");
  }
  tokenizeExec(exec);

  return {
    id: desktopId,
    name,
    comment: decodeDesktopValue(entry.get("Comment") || "").slice(0, 300),
    icon: getIconName(entry.get("Icon") || ""),
    categories: (entry.get("Categories") || "")
      .split(";")
      .filter((category) => /^[A-Za-z0-9-]{1,64}$/.test(category))
      .slice(0, 20),
  };
}

async function listApplications(directories = getApplicationDirectories()) {
  const applications = new Map();
  let visitedFiles = 0;

  async function visit(directory, root, depth) {
    if (depth > MAX_DIRECTORY_DEPTH || applications.size >= MAX_APPS) return;
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EACCES") return;
      throw error;
    }

    for (const entry of entries) {
      if (applications.size >= MAX_APPS) break;
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(filePath, root, depth + 1);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".desktop")) continue;
      visitedFiles += 1;
      if (visitedFiles > MAX_APPS * 5) break;

      const relativePath = path.relative(root, filePath);
      const desktopId = relativePath
        .split(path.sep)
        .join("-")
        .replace(/\.desktop$/i, "");
      try {
        const contents = await fs.readFile(filePath, "utf8");
        const application = parseDesktopEntry(
          contents,
          `${desktopId}.desktop`,
        );
        if (application && !applications.has(application.id)) {
          applications.set(application.id, application);
        }
      } catch (error) {
        process.stderr.write(
          `${JSON.stringify({
            message: "Skipping invalid desktop entry.",
            file: filePath,
            reason: error.message,
          })}\n`,
        );
      }
    }
  }

  for (const directory of directories) {
    await visit(directory, directory, 0);
    if (applications.size >= MAX_APPS) break;
  }
  return [...applications.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function getSystemMetrics() {
  const totalMemoryBytes = os.totalmem();
  const freeMemoryBytes = os.freemem();
  const [loadAverage1m] = os.loadavg();

  return {
    logicalCpus: os.cpus().length,
    loadAverage1m: Number.isFinite(loadAverage1m) ? loadAverage1m : null,
    memory: {
      totalBytes: totalMemoryBytes,
      freeBytes: freeMemoryBytes,
    },
  };
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(
          Object.assign(new Error("Request body is too large."), {
            statusCode: 413,
          }),
        );
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("Invalid JSON body."), {
          statusCode: 400,
        }));
      }
    });
    request.on("error", reject);
  });
}

function isAuthorized(request, token) {
  const authorization = request.headers.authorization || "";
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(authorization);
  if (!match) return false;
  const provided = Buffer.from(match[1]);
  const expected = Buffer.from(token);
  return (
    provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected)
  );
}

function createAgentServer({
  token = crypto.randomBytes(32).toString("hex"),
  allowedOrigins = getAllowedOrigins(),
  appDirectories = getApplicationDirectories(),
  iconDirectories = getIconDirectories(),
  launchApplication = (id) =>
    new Promise((resolve, reject) => {
      const child = spawn(GTK_LAUNCH_PATH, [id], {
        detached: true,
        stdio: "ignore",
        shell: false,
      });
      child.once("error", reject);
      child.once("spawn", () => {
        child.unref();
        resolve();
      });
    }),
  getMetrics = getSystemMetrics,
} = {}) {
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) {
    throw new TypeError("Agent token must contain 32 to 256 safe characters.");
  }

  const originList =
    allowedOrigins instanceof Set
      ? [...allowedOrigins]
      : Array.isArray(allowedOrigins)
        ? allowedOrigins
        : null;
  if (!originList) {
    throw new TypeError("Allowed origins must be a list of exact origins.");
  }
  const origins = new Set();
  for (const origin of originList) {
    if (typeof origin !== "string" || !getAllowedOrigins(origin).has(origin)) {
      throw new TypeError("Allowed origins must be exact safe origins.");
    }
    origins.add(origin);
  }
  const server = http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    const origin = request.headers.origin;
    const hostHeader = (request.headers.host || "").split(":")[0];
    if (
      !isLoopbackAddress(request.socket.remoteAddress) ||
      !isLoopbackHostname(hostHeader)
    ) {
      sendJson(response, 403, { error: "Loopback access only." });
      return;
    }

    if (origin && !origins.has(origin)) {
      sendJson(response, 403, { error: "Origin not allowed." });
      return;
    }
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }

    if (request.method === "OPTIONS") {
      if (!origin || !origins.has(origin)) {
        sendJson(response, 403, { error: "Origin not allowed." });
        return;
      }
      const preflightHeaders = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
      };
      if (request.headers["access-control-request-private-network"] === "true") {
        preflightHeaders["Access-Control-Allow-Private-Network"] = "true";
      }
      response.writeHead(204, preflightHeaders);
      response.end();
      return;
    }

    const pathname = new URL(request.url, "http://localhost").pathname;
    if (request.method === "GET" && pathname === "/health") {
      sendJson(response, 200, {
        status: "ok",
        service: "orbe-linux-agent",
      });
      return;
    }

    if (!isAuthorized(request, token)) {
      sendJson(response, 401, { error: "Authorization required." });
      return;
    }

    if (request.method === "GET" && pathname === "/api/apps") {
      try {
        sendJson(response, 200, { applications: await listApplications(appDirectories) });
      } catch (error) {
        process.stderr.write(
          `${JSON.stringify({
            message: "Unable to list desktop applications.",
            reason: error.message,
          })}\n`,
        );
        sendJson(response, 500, { error: "Unable to list applications." });
      }
      return;
    }

    if (request.method === "GET" && pathname === "/api/system") {
      try {
        sendJson(response, 200, { metrics: getMetrics() });
      } catch (error) {
        process.stderr.write(
          `${JSON.stringify({
            message: "Unable to read system metrics.",
            reason: error.message,
          })}\n`,
        );
        sendJson(response, 500, { error: "Unable to read system metrics." });
      }
      return;
    }

    const iconMatch = /^\/api\/icons\/([A-Za-z0-9_.-]{1,120})$/.exec(pathname);
    if (request.method === "GET" && iconMatch) {
      try {
        const image = await readApplicationIcon(iconMatch[1], iconDirectories);
        if (!image) {
          sendJson(response, 404, { error: "Application icon not found." });
          return;
        }
        response.writeHead(200, {
          "Content-Type": image.contentType,
          "Content-Length": image.body.length,
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        });
        response.end(image.body);
      } catch (error) {
        process.stderr.write(
          `${JSON.stringify({
            message: "Unable to read application icon.",
            reason: error.message,
          })}\n`,
        );
        sendJson(response, 500, { error: "Unable to read application icon." });
      }
      return;
    }

    if (request.method === "POST" && pathname === "/api/apps/launch") {
      if (!request.headers["content-type"]?.startsWith("application/json")) {
        sendJson(response, 415, { error: "Use application/json." });
        return;
      }
      try {
        const body = await readJsonBody(request);
        if (
          !body ||
          typeof body !== "object" ||
          Array.isArray(body) ||
          Object.keys(body).length !== 1 ||
          typeof body.id !== "string" ||
          !APP_ID_PATTERN.test(body.id)
        ) {
          sendJson(response, 400, { error: "Invalid application identifier." });
          return;
        }
        const applications = await listApplications(appDirectories);
        if (!applications.some((application) => application.id === body.id)) {
          sendJson(response, 404, { error: "Application not found." });
          return;
        }
        await launchApplication(body.id);
        sendJson(response, 202, { status: "launched" });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode === 500) {
          process.stderr.write(
            `${JSON.stringify({
              message: "Unable to launch desktop application.",
              reason: error.message,
            })}\n`,
          );
        }
        sendJson(
          response,
          statusCode,
          { error: statusCode === 500 ? "Unable to launch application." : error.message },
        );
      }
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  });

  return { server, token, allowedOrigins: origins };
}

if (require.main === module) {
  try {
    const agent = createAgentServer();
    agent.server.on("error", (error) => {
      process.stderr.write(
        `Unable to start Orbe Linux agent: ${error.message}\n`,
      );
      process.exitCode = 1;
    });
    agent.server.listen(PORT, HOST, () => {
      process.stdout.write(
        `Orbe Linux agent listening on http://${HOST}:${PORT}\n` +
          `Pairing token (keep private): ${agent.token}\n`,
      );
    });
  } catch (error) {
    process.stderr.write(`Unable to start Orbe Linux agent: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  createAgentServer,
  getAllowedOrigins,
  getApplicationDirectories,
  getIconDirectories,
  getSystemMetrics,
  listApplications,
  parseDesktopEntry,
  readApplicationIcon,
};
