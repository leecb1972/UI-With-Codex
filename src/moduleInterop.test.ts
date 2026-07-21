import { resolveDefaultExport } from "./moduleInterop";

describe("module interoperability", () => {
  it("accepts direct ESM exports", () => {
    const component = () => null;
    expect(resolveDefaultExport(component)).toBe(component);
  });

  it("unwraps CommonJS default exports used by Electron", () => {
    const component = () => null;
    expect(resolveDefaultExport({ default: component })).toBe(component);
  });
});
