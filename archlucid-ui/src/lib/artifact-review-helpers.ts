/** Artifact review helpers surface (barrel). */

export type { ArtifactViewKind, PreparedArtifactBody } from "./artifact-review-view-kind";
export { classifyArtifactView, prepareArtifactBodyText } from "./artifact-review-view-kind";

export {
  getArtifactBusinessLabel,
  getArtifactDisplayLabel,
  getArtifactFormatLabel,
  getArtifactTypeDescription,
  getArtifactTypeLabel,
  sponsorArtifactSecondaryCaption,
  stripArtifactFilenameExtension,
} from "./artifact-review-labels";

export type { SponsorArtifactAudienceBucket } from "./artifact-review-audience";
export {
  DELIVERABLE_TAB_ARB_BUCKETS,
  DELIVERABLE_TAB_SPONSOR_BUCKETS,
  sponsorArtifactAudienceBucket,
  sponsorArtifactAudienceLine,
  sponsorArtifactDownloadActionLabel,
  sponsorArtifactOpenActionLabel,
  sponsorAudienceSectionHeading,
  sponsorAudienceSectionLead,
} from "./artifact-review-audience";
