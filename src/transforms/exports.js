const cleanupExports = (root, j) => {
  //   root.find(j.ExportNamedDeclaration).forEach((path) => {
  //     if (
  //       path.value.exportKind === 'type' ||
  //       path.value.exportKind === 'typeof'
  //     ) {
  //       path.value.exportKind = 'value';
  //     }
  //   });

  root.find(j.ExportNamedDeclaration).forEach((path) => {
    const node = path.node;
    // Only handle type or typeof exports
    if (node.exportKind && node.exportKind !== 'value') {
      // Change the declaration-level exportKind
      node.exportKind = 'value';
      // Ensure all specifiers are value exports
      if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          if (spec.exportKind && spec.exportKind !== 'value') {
            spec.exportKind = 'value';
          }
        });
      }
    }
  });
};

export { cleanupExports };
