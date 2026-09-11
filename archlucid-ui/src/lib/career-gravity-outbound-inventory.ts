/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_OUTBOUND_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_OUTBOUND_INVENTORY.md" as const;

export type CareerGravityOutboundLeakClass = "covered" | "bypass" | "related" | "eval-ok";

export type CareerGravityOutboundRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravityOutboundLeakClass;
  readonly ownerPrompt: string;
};

export const CAREER_GRAVITY_OUTBOUND_ROWS: readonly CareerGravityOutboundRow[] = [
  {
    relativePath: "archlucid-ui/src/components/use-email-run-to-sponsor-banner.ts",
    leakClass: "covered",
    ownerPrompt: "CG-029",
  },
  {
    relativePath: "archlucid-ui/src/components/EmailRunToSponsorBanner.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-029",
  },
  {
    relativePath: "archlucid-ui/src/components/EmailRunToSponsorExportActions.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-029",
  },
  {
    relativePath: "ArchLucid.Application/ExecDigest/ExecDigestComposition.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-037",
  },
  {
    relativePath: "ArchLucid.Application/ExecDigest/ExecDigestCompositionMarkdownFormatter.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-037",
  },
  {
    relativePath: "ArchLucid.Application/Notifications/Email/ExecDigestEmailDispatcher.cs",
    leakClass: "related",
    ownerPrompt: "CG-037",
  },
  {
    relativePath: "ArchLucid.Application/SponsorDigest/SponsorDigestWeeklyDeliveryScanner.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-037",
  },
  {
    relativePath: "ArchLucid.Application/Pilots/BoardPackPdfBuilder.cs",
    leakClass: "related",
    ownerPrompt: "CG-037",
  },
  {
    relativePath: "ArchLucid.Application/Integrations/Itsm/Outbound/ItsmOutboundIssueCreationService.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-038",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Integrations/ItsmOutboundIssuesController.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-038",
  },
  {
    relativePath: "archlucid-ui/src/components/itsm/ItsmOutboundCreateIssueDialog.tsx",
    leakClass: "bypass",
    ownerPrompt: "CG-038",
  },
  {
    relativePath: "ArchLucid.Core/Integration/IntegrationWebhookPayloadSamples.cs",
    leakClass: "bypass",
    ownerPrompt: "CG-036",
  },
  {
    relativePath: "ArchLucid.Application/Advisory/AdvisoryScanRunner.cs",
    leakClass: "covered",
    ownerPrompt: "CG-036",
  },
  {
    relativePath: "ArchLucid.Application/Alerts/AlertActionLoopReader.cs",
    leakClass: "covered",
    ownerPrompt: "CG-036",
  },
  {
    relativePath: "ArchLucid.Persistence/Alerts/AlertService.cs",
    leakClass: "covered",
    ownerPrompt: "CG-036",
  },
  {
    relativePath: "ArchLucid.Persistence/Alerts/CompositeAlertService.cs",
    leakClass: "covered",
    ownerPrompt: "CG-036",
  },
  {
    relativePath: "archlucid-ui/src/components/alerts/AlertsInboxAlertCard.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-036",
  },
] as const;
