const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '__pycache__',
];

// Glob patterns for paths to skip
const SKIP_PATHS = [
  '**/*.test.js', // Skip test files
  '**/*.spec.js', // Skip spec files
  '**/test/**', // Skip test directories
  '**/tests/**', // Skip tests directories
  '**/__tests__/**', // Skip __tests__ directories
  '**/coverage/**', // Skip coverage directories
  '**/node_modules/**', // Skip node_modules (redundant but explicit)
  '**/.git/**', // Skip git directories
  // Add more patterns as needed
  // Examples:
  // '**/config/*.js',       // Skip config files
  // '**/*-generated.js',    // Skip generated files
  // '**/vendor/**',         // Skip vendor directories
];

export { SKIP_DIRS, SKIP_PATHS };
