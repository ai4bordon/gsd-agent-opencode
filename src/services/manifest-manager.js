import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { MANIFEST_FILENAME } from "../../lib/constants.js";

export class ManifestManager {
  constructor(installRoot) {
    if (!installRoot) throw new Error("installRoot обязателен");
    this.installRoot = installRoot;
    this.manifestPath = path.join(installRoot, MANIFEST_FILENAME);
    this.entries = [];
  }

  addFile(absolutePath, relativePath, size, hash) {
    this.entries.push({
      path: absolutePath,
      relativePath: relativePath.replace(/\\/g, "/"),
      size,
      hash,
    });
  }

  getAllEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
  }

  async save() {
    const parentDir = path.dirname(this.manifestPath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(this.manifestPath, JSON.stringify(this.entries, null, 2), "utf-8");
    return this.manifestPath;
  }

  async load() {
    try {
      const raw = await fs.readFile(this.manifestPath, "utf-8");
      this.entries = JSON.parse(raw);
      return this.entries;
    } catch (error) {
      if (error?.code === "ENOENT") {
        this.entries = [];
        return null;
      }
      throw error;
    }
  }

  static async calculateHash(filePath) {
    const buf = await fs.readFile(filePath);
    const hash = createHash("sha256").update(buf).digest("hex");
    return `sha256:${hash}`;
  }
}
