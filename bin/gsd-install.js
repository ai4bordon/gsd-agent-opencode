#!/usr/bin/env node

/**
 * Legacy-шим: сохраняет привычный паттерн вызова без подкоманд.
 *
 * Примеры:
 * - gsd-agent-opencode --global   -> gsd-agent-opencode install --global
 * - gsd-agent-opencode --local    -> gsd-agent-opencode install --local
 * - gsd-agent-opencode (пусто)    -> gsd-agent-opencode install
 */

import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

function isLegacyPattern(args) {
  const userArgs = args.slice(2);
  if (userArgs.length === 0) return true;

  const legacyFlags = ["--global", "-g", "--local", "-l", "--config-dir", "-c", "--verbose", "--force", "-f"];
  return userArgs.some((arg) => legacyFlags.some((flag) => arg === flag || arg.startsWith(`${flag}=`)));
}

function transformArgs(args) {
  const userArgs = args.slice(2);
  if (userArgs[0] === "install") return args;
  return [...args.slice(0, 2), "install", ...userArgs];
}

function main() {
  const args = process.argv;
  if (isLegacyPattern(args)) {
    process.argv = transformArgs(args);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const entryPath = path.join(__dirname, "gsd.js");
  import(pathToFileURL(entryPath).href);
}

main();
