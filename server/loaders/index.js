// loaders/index.js
import path from "path";
import { loadPDF } from "./loadPDF.js";
import { loadTXT } from "./loadTXT.js";
import { loadDOCX } from "./loadDOCX.js";
import { loadMD } from "./loadMD.js";

const loaderMap = {
  ".pdf": loadPDF,
  ".txt": loadTXT,
  ".docx": loadDOCX,
  ".md": loadMD,
};

/**
 * Load all documents and return an array of:
 *   { file: string, content: string }
 * @param {string[]} filePaths
 * @returns {Promise<Array<{ file: string, content: string }>>}
 */
export async function loadDocuments(filePaths) {
  console.log("🔍 Loading documents...", filePaths);
  const results = [];

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase();
    console.log("🔍 Loading document...", ext);
    const loader = loaderMap[ext];

    if (!loader) {
      console.warn(`⚠️ Unsupported file type: ${filePath}`);
      continue;
    }

    try {
      const content = await loader(filePath);
      results.push({ file: filePath, content });
    } catch (err) {
      console.error(`❌ Failed to load ${filePath}:`, err.message);
    }
  }

  return results;
}
