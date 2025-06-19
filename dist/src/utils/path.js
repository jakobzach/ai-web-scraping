import { fileURLToPath } from 'url';
import { dirname } from 'path';
export function getCurrentFile(importMetaUrl) {
    return fileURLToPath(importMetaUrl);
}
export function getCurrentDir(importMetaUrl) {
    return dirname(fileURLToPath(importMetaUrl));
}
export function getFilePaths(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    const __dirname = dirname(__filename);
    return { __filename, __dirname };
}
//# sourceMappingURL=path.js.map