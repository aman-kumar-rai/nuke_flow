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

// Global statistics
const globalStats = {
  totalFilesEncountered: 0,
  jsFilesFound: 0,
  nonJSFilesSkipped: 0,
  directoriesProcessed: 0,
  filesProcessedSuccessfully: 0,
  filesWithErrors: 0,
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
console.log(`📊 Total files encountered: ${globalStats.totalFilesEncountered}`);
console.log(`📄 JavaScript files found: ${globalStats.jsFilesFound}`);
console.log(`⏭️  Non-JS files skipped: ${globalStats.nonJSFilesSkipped}`);
console.log(`📁 Directories processed: ${globalStats.directoriesProcessed}`);
console.log(
  `✅ Files processed successfully: ${globalStats.filesProcessedSuccessfully}`,
);
console.log(`❌ Files with errors: ${globalStats.filesWithErrors}`);
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

    globalStats.filesProcessedSuccessfully++;
  } catch (error) {
    globalStats.filesWithErrors++;
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

async function processDirectory(dirPath, depth = 0) {
  const startTime = performance.now();
  const indent = '  '.repeat(depth);
  const relativePath = relative(process.cwd(), dirPath);

  console.log(`${indent}📁 Processing directory: ${relativePath || '.'}`);

  // Directory-level statistics
  const dirStats = {
    totalFilesEncountered: 0,
    jsFilesFound: 0,
    nonJSFilesSkipped: 0,
    subdirectoriesProcessed: 0,
    filesProcessedSuccessfully: 0,
    filesWithErrors: 0,
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
        dirStats.subdirectoriesProcessed++;
        globalStats.directoriesProcessed++;
      } else if (entry.isFile()) {
        dirStats.totalFilesEncountered++;
        globalStats.totalFilesEncountered++;

        // Check if path should be skipped (glob patterns)
        if (shouldSkipPath(relativePath)) {
          console.log(`${indent}  ⏭️  Skipping file (glob): ${entry.name}`);
          continue;
        }

        if (isJSFile(fullPath)) {
          dirStats.jsFilesFound++;
          globalStats.jsFilesFound++;

          try {
            console.log(`${indent}  📝 Processing: ${entry.name}`);
            await processFile(fullPath);
            dirStats.filesProcessedSuccessfully++;
          } catch (error) {
            console.error(
              `${indent}  ❌ Error processing ${entry.name}: ${error.message}`,
            );
            dirStats.filesWithErrors++;
          }
        } else {
          console.log(`${indent}  ⏭️  Skipping non-JS file: ${entry.name}`);
          dirStats.nonJSFilesSkipped++;
          globalStats.nonJSFilesSkipped++;
        }
      }
    }
  } catch (error) {
    console.error(
      `${indent}❌ Error reading directory ${dirPath}: ${error.message}`,
    );
    return;
  }

  const endTime = performance.now();

  // Display directory statistics
  console.log(`${indent}📊 Directory Summary: ${relativePath || '.'}`);
  console.log(
    `${indent}   Files encountered: ${dirStats.totalFilesEncountered}`,
  );
  console.log(`${indent}   JS files found: ${dirStats.jsFilesFound}`);
  console.log(`${indent}   Non-JS skipped: ${dirStats.nonJSFilesSkipped}`);
  console.log(
    `${indent}   Subdirectories: ${dirStats.subdirectoriesProcessed}`,
  );
  console.log(
    `${indent}   Successfully processed: ${dirStats.filesProcessedSuccessfully}`,
  );
  console.log(`${indent}   Errors: ${dirStats.filesWithErrors}`);
  console.log(
    `${indent}   ⏱️  Directory time: ${(endTime - startTime).toFixed(2)}ms`,
  );
  console.log(`${indent}${'─'.repeat(50)}`);
}
