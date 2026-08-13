/**
 * Baseline for the `title`-attribute-as-help ban (UI_DESIGN_SYSTEM.md § Operator page contextual
 * help — mount + interaction contract, TB-1666).
 *
 * These 10 files carried a native `title` attribute when the rule landed on 2026-08-09. The rule is
 * an error everywhere else so new hover-only help cannot be introduced; this list exists only so the
 * rule could land without a 135-site refactor in one change. Sweeping it is TB-2147.
 *
 * Three distinct patterns are baselined here, and they do not all have the same fix:
 *   1. Fake tooltips — `<span className="cursor-help underline decoration-dotted" title={…}>`.
 *      Replace with `FieldHelpTooltip` (short hint) or `HelpPopover` (anything interactive).
 *   2. Disabled-reason copy — `title={disabled ? whyDisabled : undefined}`. The reason must become
 *      visible near the control; a mouse-only explanation of why a button cannot be pressed is a
 *      dead end for keyboard and touch users.
 *   3. Truncation reveal — `<td className="truncate" title={fullText}>`. Overflow recovery rather
 *      than help; needs a widened column, wrapping, or a real tooltip. Not yet ratified.
 *
 * Do not add entries. Shrink this list; when it is empty, delete the file and the override block.
 */
export const TITLE_ATTRIBUTE_LEGACY_SURFACES = [
  "src/components/GovernanceApprovalInspectorPreview.tsx",
  "src/components/InspectorPanel.tsx",
  "src/components/LayerContextStrip.tsx",
  "src/components/LayerHeader.tsx",
  "src/components/marketing/CtaButton.tsx",
  "src/components/provenance/ProvenancePageWorkspace.tsx",
  "src/components/ProvenanceReferenceLink.tsx",
  "src/components/RoiTelemetryCard.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/usability/WizardEvidenceUploadZone.tsx",
];

export default TITLE_ATTRIBUTE_LEGACY_SURFACES;
