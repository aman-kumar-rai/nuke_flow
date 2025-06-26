import { basename, dirname, extname, join } from 'node:path';
import { SKIP_DIRS, SKIP_PATHS } from '../constants';

// check if file is a js file
const isJSFile = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  return ext === '.js' || ext === '.jsx';
};

// returns if a directory should be skipped
function shouldSkipDirectory(dirName) {
  return SKIP_DIRS.includes(dirName) || dirName.startsWith('.');
}

// check if a path should be skipped based on glob patterns
function shouldSkipPath(filePath) {
  return SKIP_PATHS.some((pattern) => matchGlob(pattern, filePath));
}

// Simple glob pattern matching
function matchGlob(pattern, text) {
  // Convert glob pattern to regex
  // * matches any characters except /
  // ** matches any characters including /
  // ? matches single character
  const regexPattern = pattern
    .replace(/\*\*/g, '<<<DOUBLESTAR>>>') // Temporarily replace **
    .replace(/\*/g, '[^/]*') // * becomes [^/]*
    .replace(/<<<DOUBLESTAR>>>/g, '.*') // ** becomes .*
    .replace(/\?/g, '[^/]') // ? becomes [^/]
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\+/g, '\\+'); // Escape plus

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(text);
}

// create a transformed file path with _transformed suffix
function createTransformedFilePath(originalPath) {
  const dir = dirname(originalPath);
  const ext = extname(originalPath);
  const nameWithoutExt = basename(originalPath, ext);

  return join(dir, `${nameWithoutExt}_transformed${ext}`);
}

export {
  isJSFile,
  shouldSkipDirectory,
  shouldSkipPath,
  createTransformedFilePath,
};
