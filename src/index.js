import jscodeshift from 'jscodeshift';
import {
  readFile,
  writeFile,
  access,
  constants,
  readdir,
  stat,
} from 'node:fs/promises';
import { resolve, basename, join, relative } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  isJSFile,
  shouldSkipDirectory,
  shouldSkipPath,
  createTransformedFilePath,
} from './utils';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Usage: node src/index.js <file-or-folder-path>');
  process.exit(1);
}

// Global statistics - only tracking JS files
const globalStats = {
  filesProcessed: 0,
  filesSkipped: 0,
  filesTransformed: 0,
  filesWithError: 0,
};

const globalStartTime = performance.now();

try {
  await processPath(inputPath);
} catch (error) {
  console.error(`💥 Fatal error: ${error.message}`);
  process.exit(1);
}

const globalEndTime = performance.now();
console.log('\n🎉 Global Processing Complete!');
console.log('================================');
console.log(`📄 JS files found: ${globalStats.filesProcessed}`);
console.log(`⏭️  JS files skipped: ${globalStats.filesSkipped}`);
console.log(`🔧 Files transformed: ${globalStats.filesTransformed}`);
console.log(`❌ Files with errors: ${globalStats.filesWithError}`);
console.log(
  `⏱️  Total execution time: ${(globalEndTime - globalStartTime).toFixed(2)}ms`,
);

async function processPath(inputPath) {
  const absolutePath = resolve(inputPath);

  try {
    await access(absolutePath, constants.F_OK);
  } catch {
    throw new Error(`Path not found: ${absolutePath}`);
  }

  const pathStat = await stat(absolutePath);

  if (pathStat.isFile()) {
    console.log('📄 Processing single file...\n');
    await processFile(absolutePath);
  } else if (pathStat.isDirectory()) {
    console.log('📁 Processing directory recursively...\n');
    await processDirectory(absolutePath, 0); // Start with depth 0
  } else {
    throw new Error(`Unsupported path type: ${absolutePath}`);
  }
}

async function processFile(filePath) {
  const startTime = performance.now();

  const sourceCode = await readFile(filePath, 'utf8');
  const j = jscodeshift.withParser('flow');

  try {
    // Parse the file
    const root = j(sourceCode);

    // Recreate source code from AST (no modifications)
    const transformedCode = root.toSource({
      quote: 'single',
      trailingComma: true,
      tabWidth: 2,
      useTabs: false,
    });

    // Write the transformed file
    const transformedFilePath = createTransformedFilePath(filePath);
    await writeFile(transformedFilePath, transformedCode, 'utf8');

    const endTime = performance.now();
    console.log(`   ✅ Created: ${basename(transformedFilePath)}`);
    console.log(`   ⏱️  File time: ${(endTime - startTime).toFixed(2)}ms`);

    globalStats.filesTransformed++;
  } catch (error) {
    globalStats.filesWithError++;
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

async function processDirectory(dirPath, depth = 0) {
  const startTime = performance.now();
  const indent = '  '.repeat(depth);
  const relativePath = relative(process.cwd(), dirPath);

  console.log(`${indent}📁 Processing directory: ${relativePath || '.'}`);

  // Directory-level statistics - only JS files
  const dirStats = {
    filesProcessed: 0,
    filesSkipped: 0,
    filesTransformed: 0,
    filesWithError: 0,
  };

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(process.cwd(), fullPath);

      if (entry.isDirectory()) {
        // Check if directory should be skipped
        if (shouldSkipDirectory(entry.name)) {
          console.log(`${indent}  ⏭️  Skipping directory: ${entry.name}`);
          continue;
        }

        // Check if path should be skipped (glob patterns)
        if (shouldSkipPath(relativePath)) {
          console.log(`${indent}  ⏭️  Skipping path (glob): ${relativePath}`);
          continue;
        }

        // Recursively process subdirectory
        console.log(`${indent}  📂 Entering subdirectory: ${entry.name}`);
        await processDirectory(fullPath, depth + 1);
      } else if (entry.isFile()) {
        // Check if path should be skipped (glob patterns)
        if (shouldSkipPath(relativePath)) {
          console.log(`${indent}  ⏭️  Skipping file (glob): ${entry.name}`);
          continue;
        }

        // Only process if it's a JS file
        if (isJSFile(fullPath)) {
          dirStats.filesProcessed++;
          globalStats.filesProcessed++;

          // TODO: Add Flow detection here
          // For now, we process all JS files
          // Later: if (!isFlowFile(fullPath)) {
          //   console.log(`${indent}  ⏭️  Skipping non-Flow JS file: ${entry.name}`);
          //   dirStats.filesSkipped++;
          //   globalStats.filesSkipped++;
          //   continue;
          // }

          try {
            console.log(`${indent}  📝 Processing: ${entry.name}`);
            await processFile(fullPath);
            dirStats.filesTransformed++;
          } catch (error) {
            console.error(
              `${indent}  ❌ Error processing ${entry.name}: ${error.message}`,
            );
            dirStats.filesWithError++;
          }
        }
        // Note: Non-JS files are completely ignored, not counted
      }
    }
  } catch (error) {
    console.error(
      `${indent}❌ Error reading directory ${dirPath}: ${error.message}`,
    );
    return;
  }

  const endTime = performance.now();

  // Display directory statistics - only if we found JS files
  if (dirStats.filesProcessed > 0) {
    console.log(`${indent}📊 Directory Summary: ${relativePath || '.'}`);
    console.log(`${indent}   JS files found: ${dirStats.filesProcessed}`);
    console.log(`${indent}   JS files skipped: ${dirStats.filesSkipped}`);
    console.log(`${indent}   Files transformed: ${dirStats.filesTransformed}`);
    console.log(`${indent}   Files with errors: ${dirStats.filesWithError}`);
    console.log(
      `${indent}   ⏱️  Directory time: ${(endTime - startTime).toFixed(2)}ms`,
    );
    console.log(`${indent}${'─'.repeat(40)}`);
  }
}
