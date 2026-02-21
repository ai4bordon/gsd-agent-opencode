/**
 * Константы для CLI/установщика gsd-agent-opencode.
 */

export const PACKAGE_ID = "gsd-agent-opencode";

// Глобальный конфиг OpenCode по умолчанию (относительно домашней директории)
export const DEFAULT_CONFIG_DIR = ".config/opencode";

// Локальный конфиг в проекте
export const LOCAL_CONFIG_DIR = ".opencode";

// Где храним метаданные установки (в папке, которой владеем полностью)
export const VERSION_FILE = "get-shit-done/VERSION";
export const MANIFEST_FILENAME = "get-shit-done/INSTALLED_FILES.json";

// Что копируем при установке (команды собираются отдельно в commands/gsd)
export const DIRECTORIES_TO_COPY = ["agents", "get-shit-done"];

// Паттерны замены путей в markdown
export const PATH_PATTERNS = {
  // «Правильный» плейсхолдер варианта A
  pkgAtReference: new RegExp(`@${PACKAGE_ID}/`, "g"),

  // Защитные/обратные замены (на случай, если что-то осталось захардкоженным)
  globalAtReference: /@~\/\.config\/opencode\//g,
  globalPlainReference: /~\/\.config\/opencode\//g,
};

// Разрешенные namespaces для безопасного удаления
export const ALLOWED_NAMESPACES = [
  /^agents\/gsd-/,       // агенты GSD
  /^commands\/gsd\//,    // новая структура команд (если установили)
  /^get-shit-done\//,    // полностью принадлежит пакету
];

export const ERROR_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  PERMISSION_ERROR: 2,
  PATH_TRAVERSAL: 3,
  INTERRUPTED: 130,
};
