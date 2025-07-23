// loaders/loadTXT.js
import fs from "node:fs/promises";

export async function loadTXT(filePath) {
  return await fs.readFile(filePath, "utf8");
}
