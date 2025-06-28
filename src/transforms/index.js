import jscodeshift from 'jscodeshift';
import { readFile } from 'node:fs/promises';

const transform = async (filePath) => {
  const j = jscodeshift.withParser('flow');

  // read the file
  const sourceCode = await readFile(filePath, 'utf8');
  const root = jscodeshift(sourceCode);

  // check if the file is a flow file(i.e. has //@flow pragma)
  const hasFlowComment =
    root
      .find(j.Comment)
      .filter((path) => /@flow/.test(path.value.value))
      .size() > 0;

  if (!hasFlowComment) {
    console.log('Skipping file: ', filePath);
    return sourceCode;
  }

  // run the tranformations
  else {
    return root.toSource();
  }
};

export { transform };
