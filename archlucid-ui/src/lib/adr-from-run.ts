/** ADR export from run data (barrel). */

export type {
  AdrGeneratorExplanationSlice,
  AdrGeneratorFindingSlice,
  AdrGeneratorManifestCounts,
  AdrGeneratorRunInput,
} from "./adr-from-run-slices";

export { buildAdrExplanationSlice, buildAdrGeneratorRunInput } from "./adr-from-run-mappers";
export { buildMadrMarkdownFromRun } from "./adr-from-run-markdown";
