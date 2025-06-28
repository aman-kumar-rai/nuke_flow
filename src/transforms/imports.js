const cleanupImports = (root, j) => {
  root.find(j.ImportDeclaration).forEach((path) => {
    if (
      path.value.importKind === 'type' ||
      path.value.importKind === 'typeof'
    ) {
      path.value.importKind = 'value';
    }
  });
};

export { cleanupImports };
