import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIRS = ["agents", "commands", "get-shit-done"];

const REPLACEMENTS = [
  {
    // Основная миграция: захардкоженный global include -> плейсхолдер пакета
    from: /@~\/\.config\/opencode\//g,
    to: "@gsd-agent-opencode/",
  },
];

async function walk(dir, onFile) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, onFile);
    else if (ent.isFile()) await onFile(full);
  }
}

async function main() {
  let changed = 0;
  let scanned = 0;

  for (const d of TARGET_DIRS) {
    const abs = path.join(ROOT, d);
    await walk(abs, async (filePath) => {
      if (!filePath.toLowerCase().endsWith(".md")) return;
      scanned++;
      const original = await fs.readFile(filePath, "utf-8");
      let next = original;
      for (const r of REPLACEMENTS) {
        next = next.replace(r.from, r.to);
      }
      if (next !== original) {
        await fs.writeFile(filePath, next, "utf-8");
        changed++;
      }
    });
  }

  process.stdout.write(`Просканировано .md: ${scanned}\n`);
  process.stdout.write(`Изменено файлов: ${changed}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
