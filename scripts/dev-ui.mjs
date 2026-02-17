import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const ROOT = process.cwd();
const UI_DIR = path.resolve(ROOT, "invoicia-saa-s-ui");

function log(message) {
  // Keep output grep-friendly for debugging.
  process.stdout.write(`[dev-ui] ${message}\n`);
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 0,
    stdout: (result.stdout ?? "").toString(),
    stderr: (result.stderr ?? "").toString(),
  };
}

function safeRm(targetPath) {
  try {
    fs.rmSync(targetPath, { force: true, recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function isPortFree(port) {
  return await new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port);
  });
}

function getPidListeningOnPort(port) {
  if (process.platform !== "win32") return null;

  const result = run("netstat", ["-ano", "-p", "TCP"]);
  if (!result.ok) return null;

  const lines = result.stdout.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const protocol = parts[0]?.toUpperCase();
    const localAddress = parts[1] ?? "";
    const state = parts[3]?.toUpperCase();
    const pid = Number(parts[4]);

    if (protocol !== "TCP") continue;
    if (state !== "LISTENING") continue;
    if (!localAddress.endsWith(`:${port}`)) continue;
    if (Number.isNaN(pid)) continue;

    return pid;
  }

  return null;
}

function getWindowsCommandLine(pid) {
  if (process.platform !== "win32") return "";
  const command = `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`;
  const result = run("powershell.exe", ["-NoProfile", "-Command", command]);
  if (!result.ok) return "";
  return result.stdout.trim();
}

function killPid(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  if (process.platform === "win32") {
    const result = run("taskkill", ["/PID", String(pid), "/F", "/T"]);
    return result.ok;
  }
  try {
    process.kill(pid, "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPortInfo(port) {
  const pid = getPidListeningOnPort(port);
  if (!pid) {
    return { port, pid: null, commandLine: "", isNext: false };
  }

  const commandLine = getWindowsCommandLine(pid);
  const normalized = commandLine.toLowerCase();

  return {
    port,
    pid,
    commandLine,
    isNext:
      normalized.includes("next") &&
      normalized.includes("start-server.js"),
  };
}

async function choosePort() {
  // On Windows, prefer OS-reported listeners (netstat) to avoid IPv4/IPv6 false positives.
  if (process.platform === "win32") {
    const info3000 = getPortInfo(3000);
    if (!info3000.pid) return 3000;

    const info3001 = getPortInfo(3001);
    if (!info3001.pid) return 3001;

    log(`Port 3000 is in use (PID ${info3000.pid}) and port 3001 is in use (PID ${info3001.pid}).`);
    return null;
  }

  const free3000 = await isPortFree(3000);
  if (free3000) return 3000;

  const free3001 = await isPortFree(3001);
  if (free3001) return 3001;

  log("Both port 3000 and port 3001 are in use.");
  return null;
}

function getPnpmSpawn() {
  // When running via `pnpm run ...`, `npm_execpath` points at pnpm's JS entry.
  // Using `node <npm_execpath>` avoids relying on `pnpm` being on PATH (Windows-safe).
  const execPath = process.env.npm_execpath;
  if (execPath && execPath.toLowerCase().includes("pnpm")) {
    return { command: process.execPath, baseArgs: [execPath] };
  }
  return { command: "pnpm", baseArgs: [] };
}

function clearNextDevLock() {
  const devDir = path.join(UI_DIR, ".next", "dev");
  const lockPath = path.join(devDir, "lock");

  const lockExists = fs.existsSync(lockPath);
  if (lockExists) {
    log(`Found lock file: ${lockPath}`);
    // If a dev server is still running, deleting the lock alone won't help.
    // We'll remove the lock (and dev dir) before launching a fresh instance.
    safeRm(lockPath);
    // If the lock was recreated or couldn't be removed, just wipe the folder.
    if (fs.existsSync(lockPath)) safeRm(devDir);
  }

  return lockExists;
}

async function main() {
  if (!fs.existsSync(UI_DIR)) {
    log(`UI directory not found: ${UI_DIR}`);
    process.exit(1);
  }

  const lockPath = path.join(UI_DIR, ".next", "dev", "lock");
  const lockExists = fs.existsSync(lockPath);

  let info3000 = getPortInfo(3000);
  let info3001 = getPortInfo(3001);

  if (info3000.pid) {
    log(`Port 3000 is in use by PID ${info3000.pid}`);
    if (info3000.commandLine) log(`PID ${info3000.pid} cmdline: ${info3000.commandLine}`);
  }
  if (info3001.pid) {
    log(`Port 3001 is in use by PID ${info3001.pid}`);
    if (info3001.commandLine) log(`PID ${info3001.pid} cmdline: ${info3001.commandLine}`);
  }

  // Optional kill switch for dev-only troubleshooting.
  if (process.env.DEV_UI_KILL_PID && process.platform === "win32") {
    const pidToKill = Number(process.env.DEV_UI_KILL_PID);
    if (!Number.isNaN(pidToKill)) {
      log(`Killing PID ${pidToKill} because DEV_UI_KILL_PID is set.`);
      killPid(pidToKill);
      await sleep(500);
      info3000 = getPortInfo(3000);
      info3001 = getPortInfo(3001);
    }
  }

  // If a Next dev server is already active and lock exists, reuse it instead of launching a competing process.
  if (lockExists && (info3000.isNext || info3001.isNext)) {
    const active = info3000.isNext ? info3000 : info3001;
    log(`Detected an existing Next dev server on port ${active.port} (PID ${active.pid}).`);
    log(`Reusing existing server at http://localhost:${active.port}`);
    process.exit(0);
  }

  // Only remove stale lock when we are about to launch a fresh server.
  clearNextDevLock();

  const chosenPort = await choosePort();

  if (!chosenPort) {
    info3000 = getPortInfo(3000);
    info3001 = getPortInfo(3001);
    if (info3000.pid) log(`Port 3000 is in use by PID ${info3000.pid}.`);
    if (info3001.pid) log(`Port 3001 is in use by PID ${info3001.pid}.`);
    log("Stop one of these processes, then retry.");
    process.exit(1);
  }

  log(`Starting UI on http://localhost:${chosenPort}`);

  const uiScript = chosenPort === 3000 ? "dev:3000" : "dev:3001";
  const pnpm = getPnpmSpawn();
  const child = spawn(
    pnpm.command,
    [...pnpm.baseArgs, "-C", UI_DIR, uiScript],
    {
    stdio: "inherit",
    windowsHide: false,
    },
  );

  child.on("error", (err) => {
    log(`Failed to spawn pnpm (${err.code || "unknown"}).`);
    log("If you are running this outside pnpm, install pnpm or run `pnpm dev` from repo root.");
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

await main();
