#!/usr/bin/env node

/**
 * Главный CLI для gsd-agent-opencode.
 *
 * Поддерживает:
 * - gsd-agent-opencode install [--global|--local]
 * - gsd-agent-opencode list
 * - gsd-agent-opencode check
 * - gsd-agent-opencode uninstall
 * - gsd-agent-opencode update
 *
 * Совместимость:
 * - gsd-agent-opencode --global / --local (legacy) -> install
 * - gsd-agent-opencode (без аргументов) -> install (интерактивно)
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { installCommand } from "../src/commands/install.js";
import { listCommand } from "../src/commands/list.js";
import { checkCommand } from "../src/commands/check.js";
import { uninstallCommand } from "../src/commands/uninstall.js";
import { updateCommand } from "../src/commands/update.js";
import { logger, setVerbose } from "../src/utils/logger.js";
import { ERROR_CODES } from "../lib/constants.js";

function getPackageVersion() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageRoot = path.resolve(__dirname, "..");
    const packageJsonPath = path.join(packageRoot, "package.json");
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function isLegacyArgs(args) {
  if (args.length <= 2) return true;

  const userArgs = args.slice(2);
  const knownCommands = [
    "install",
    "list",
    "ls",
    "check",
    "verify",
    "uninstall",
    "rm",
    "update",
    "--help",
    "-h",
    "--version",
    "-v",
    "-V",
  ];
  const hasKnownCommand = knownCommands.some((c) => userArgs.includes(c));
  if (hasKnownCommand) return false;

  const legacyFlags = ["--global", "-g", "--local", "-l", "--config-dir", "-c", "--verbose"]; 
  return legacyFlags.some((flag) => userArgs.some((a) => a === flag || a.startsWith(`${flag}=`)));
}

function transformLegacyArgs(args) {
  const userArgs = args.slice(2);

  if (userArgs.length === 0) {
    return [...args.slice(0, 2), "install"];
  }

  if (userArgs[0] === "install") return args;

  if (userArgs[0].startsWith("-")) {
    return [...args.slice(0, 2), "install", ...userArgs];
  }

  return args;
}

async function main() {
  const program = new Command();

  program
    .name("gsd-agent-opencode")
    .description("Менеджер дистрибуции gsd-agent-opencode (global/local установка)")
    .version(getPackageVersion(), "-v, --version", "Показать версию")
    .helpOption("-h, --help", "Показать помощь")
    .option("--verbose", "Подробный вывод (для отладки)", false);

  program
    .command("install")
    .description("Установить систему gsd-agent-opencode")
    .option("-g, --global", "Установить глобально в OPENCODE_CONFIG_DIR (~/.config/opencode)")
    .option("-l, --local", "Установить локально в ./.opencode (в текущем проекте)")
    .option("-c, --config-dir <path>", "Переопределить OPENCODE_CONFIG_DIR (только для --global)")
    .option("-f, --force", "Переустановить без вопросов (опасно)")
    .action(async (options, command) => {
      const globalOptions = command.parent.opts();
      const exitCode = await installCommand({ ...options, verbose: globalOptions.verbose });
      process.exit(exitCode);
    });

  program
    .command("list")
    .alias("ls")
    .description("Показать статус установки")
    .option("-g, --global", "Только глобальная установка")
    .option("-l, --local", "Только локальная установка")
    .option("-c, --config-dir <path>", "Переопределить OPENCODE_CONFIG_DIR (для --global)")
    .action(async (options, command) => {
      const globalOptions = command.parent.opts();
      const exitCode = await listCommand({ ...options, verbose: globalOptions.verbose });
      process.exit(exitCode);
    });

  program
    .command("check")
    .alias("verify")
    .description("Проверить целостность установки")
    .option("-g, --global", "Только глобальная установка")
    .option("-l, --local", "Только локальная установка")
    .option("-c, --config-dir <path>", "Переопределить OPENCODE_CONFIG_DIR (для --global)")
    .action(async (options, command) => {
      const globalOptions = command.parent.opts();
      const exitCode = await checkCommand({ ...options, verbose: globalOptions.verbose });
      process.exit(exitCode);
    });

  program
    .command("uninstall")
    .alias("rm")
    .description("Удалить установку (безопасно, только свои файлы)")
    .option("-g, --global", "Удалить глобальную установку")
    .option("-l, --local", "Удалить локальную установку")
    .option("-c, --config-dir <path>", "Переопределить OPENCODE_CONFIG_DIR (для --global)")
    .option("--dry-run", "Показать, что будет удалено")
    .option("-f, --force", "Удалить без подтверждения")
    .action(async (options, command) => {
      const globalOptions = command.parent.opts();
      const exitCode = await uninstallCommand({ ...options, verbose: globalOptions.verbose });
      process.exit(exitCode);
    });

  program
    .command("update")
    .description("Обновить установку (переустановка текущей версии пакета)")
    .option("-g, --global", "Обновить глобальную установку")
    .option("-l, --local", "Обновить локальную установку")
    .option("-c, --config-dir <path>", "Переопределить OPENCODE_CONFIG_DIR (для --global)")
    .option("-f, --force", "Без подтверждения")
    .action(async (options, command) => {
      const globalOptions = command.parent.opts();
      const exitCode = await updateCommand({ ...options, verbose: globalOptions.verbose });
      process.exit(exitCode);
    });

  const args = process.argv;
  if (isLegacyArgs(args)) {
    process.argv = transformLegacyArgs(args);
    if (args.includes("--verbose")) {
      setVerbose(true);
      logger.debug("Обнаружен legacy-вызов, маршрутизация на install");
    }
  }

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  logger.error(`Неожиданная ошибка: ${error?.message || String(error)}`);
  setVerbose(true);
  logger.debug(error?.stack || String(error));
  process.exit(ERROR_CODES.GENERAL_ERROR);
});
