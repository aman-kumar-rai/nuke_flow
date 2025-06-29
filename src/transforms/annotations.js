// remove flow annotations like //@flow, //@flow-strict etc...
// todo: have added basic regex, need to cover all flow annotations used in the codebase
const annotations = (root, j) => {
  root
    .find(j.Comment)
    .filter((path) => /@flow|@noflow|\$FlowFixMe/.test(path.value.value))
    .forEach((path) => path.prune());
};

export { annotations };
