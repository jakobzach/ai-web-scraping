import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get the current file path (replacement for __filename in ESM)
 * Usage: getCurrentFile(import.meta.url)
 */
export function getCurrentFile(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}

/**
 * Get the current directory path (replacement for __dirname in ESM)
 * Usage: getCurrentDir(import.meta.url)
 */
export function getCurrentDir(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Convenience function to get both file and directory
 * Usage: const { __filename, __dirname } = getFilePaths(import.meta.url);
 */
export function getFilePaths(importMetaUrl: string) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);
  return { __filename, __dirname };
} 