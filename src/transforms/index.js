import jscodeshift from 'jscodeshift';
import { readFile } from 'node:fs/promises';
import { cleanupAnnotations } from '#transforms/annotations.js';
import { cleanupImports } from '#transforms/imports.js';
import { cleanupExports } from '#transforms/exports.js';

const transform = async (filePath) => {
  const j = jscodeshift.withParser('flow');

  // read the file
  const sourceCode = await readFile(filePath, 'utf8');
  const root = jscodeshift(sourceCode);

  cleanupAnnotations(root, j);
  //   cleanupImports(root, j);
  //   cleanupExports(root, j);

  return root.toSource();
};

export { transform };
