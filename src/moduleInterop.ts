export function resolveDefaultExport<T>(module: T | { default: T }): T {
  if (typeof module === "object" && module !== null && "default" in module) {
    return module.default;
  }
  return module;
}
