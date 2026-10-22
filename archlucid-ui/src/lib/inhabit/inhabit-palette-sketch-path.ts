const nestedArchitectureFindingsPathPattern =
  /^\/architecture\/architectures\/[^/]+\/findings(\/|$)/;

const architectureDeskPathPattern = /^\/architecture\/architectures(\/|$)/;

/** IH-051 — palette Sketch / clone when spawn-locked on desk or nested findings. */
export function isInhabitPaletteSketchArchitecturePath(pathname: string): boolean {
  return architectureDeskPathPattern.test(pathname) || nestedArchitectureFindingsPathPattern.test(pathname);
}
