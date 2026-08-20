import { STRUCTURED_BRIEF_HELP_CANONICAL_PATH } from "@/lib/structured-brief-help-evidence-copy";

export type StructuredBriefCapabilitiesQualitySurfaceId = "architecture-draft-structured-brief";

export type StructuredBriefCapabilitiesQualityVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly helpHref: string;
  readonly helpLabel: string;
};

export const STRUCTURED_BRIEF_CAPABILITIES_QUALITY_HEADING =
  "Required capabilities and quality attributes are different" as const;

export const STRUCTURED_BRIEF_CAPABILITIES_QUALITY_WHY_TWO =
  "Required capabilities name platform traits the design must support — for example HTTPS ingress, managed database, or observability. Quality attributes state how well the system must perform — with a numeric target such as RTO 4h or p95 latency 200ms when you have one, or a qualitative target such as defense in depth when a number does not apply. Capabilities describe what must exist; quality attributes describe how good it must be." as const;

export const STRUCTURED_BRIEF_CAPABILITIES_QUALITY_COMPACT_LINE =
  "Capabilities name platform traits; quality attributes describe performance or resilience targets." as const;

export function buildStructuredBriefCapabilitiesQualityVocabulary(): StructuredBriefCapabilitiesQualityVocabularyModel {
  return {
    heading: STRUCTURED_BRIEF_CAPABILITIES_QUALITY_HEADING,
    whyTwo: STRUCTURED_BRIEF_CAPABILITIES_QUALITY_WHY_TWO,
    compactLine: STRUCTURED_BRIEF_CAPABILITIES_QUALITY_COMPACT_LINE,
    helpHref: STRUCTURED_BRIEF_HELP_CANONICAL_PATH,
    helpLabel: "Read structured brief help",
  };
}
