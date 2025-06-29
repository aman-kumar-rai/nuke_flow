import jscodeshift from 'jscodeshift';
import { readFile } from 'node:fs/promises';
import { annotations } from '#transforms/annotations.js';
import { imports } from '#transforms/imports.js';
import { exports } from '#transforms/exports.js';

const transform = async (filePath) => {
  const j = jscodeshift.withParser('flow');

  // read the file
  const sourceCode = await readFile(filePath, 'utf8');
  const root = j(sourceCode);

  annotations(root, j);
  imports(root, j);
  exports(root, j);

  return root.toSource();
};

export { transform };
