import path from "path";
import fs from "fs/promises";

/**
 * Security Utility for path validation
 */

const ALLOWED_DIRECTORIES = [
  process.env.DATA_DIR || path.join(process.cwd(), "data"),
  process.env.MODELS_DIR || path.join(process.cwd(), "models"),
  process.env.OUTPUT_DIR || path.join(process.cwd(), "exports"),
];

/**
 * Validates that a path is within the allowed directories and does not contain traversal sequences.
 */
export async function validatePath(filePath: string): Promise<string> {
  const resolvedPath = path.resolve(filePath);

  const isAllowed = ALLOWED_DIRECTORIES.some(dir =>
    resolvedPath.startsWith(path.resolve(dir))
  );

  if (!isAllowed) {
    throw new Error(`Security Violation: Path ${filePath} is not allowed.`);
  }

  // Double check if path exists
  try {
    await fs.access(resolvedPath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  return resolvedPath;
}
