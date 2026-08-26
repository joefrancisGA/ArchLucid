export {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_LITE_SCOPE,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_SCOPE,
  buildCaiqSigResponseTocGroups,
  prepareCaiqSigResponseHelpMarkdown,
  resolveCaiqSigHelpTableCaption,
  structureCaiqSigResponseHelpMarkdown,
  type HelpTopicTocGroup,
} from "./caiq-sig-markdown-normalize";

export {
  CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT,
  countWordsInCaiqSigEvidenceText,
  parseCaiqSigEvidenceSegments,
  resolveCaiqSigEvidenceAffordance,
  type CaiqSigEvidenceAffordance,
  type CaiqSigEvidenceAffordanceKind,
  type CaiqSigEvidenceSegment,
  type CaiqSigEvidenceSegmentKind,
} from "./caiq-sig-evidence-segments";

export {
  computeCaiqSigResponsePostureCounts,
  countCaiqSigResponseTableRows,
  mapCaiqSigStatusLabelToTagKind,
  resolveCaiqSigStatusNarrative,
  resolveCaiqSigStatusQualifier,
  resolveCaiqSigStatusTagLabel,
  sumCaiqSigResponsePostureCounts,
  type CaiqSigPostureStatus,
  type CaiqSigResponsePostureCounts,
} from "./caiq-sig-posture-counts";

export function isCaiqSigResponseHelpTopic(helpTopicSlug: string | undefined): boolean {
  return helpTopicSlug === "caiq-sig-response";
}
