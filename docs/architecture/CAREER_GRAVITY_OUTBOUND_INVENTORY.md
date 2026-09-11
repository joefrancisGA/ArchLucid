> **Scope:** Shrink-only inventory — email-to-sponsor, weekly digest, ITSM tickets, webhooks, and alerts that can describe a Simulator run as a sealed Career decision. **Do not change payloads in this file.** CG-036–038 / CG-094 own mutations.

> **Spine:** ADR **0091** · CG-003 · LP-06 · LP-17 · CG-006

# Career-gravity outbound inventory

**Last reviewed:** 2026-09-11

Outbound is how rehearsal leaks into another system of record. Sponsors and tickets never see the chooser.

## Leak classes

| Class | Meaning | Typical owner |
|-------|---------|---------------|
| **covered** | Honesty / Mode field already on the outbound payload | leftover only if a call site skips it |
| **bypass** | Career-shaped send with no Mode/door on the payload | CG-036–038 |
| **related** | Sealed-hash / completeness only — not rehearsal labeling | CG-029 adjacent |
| **eval-ok** | Demo / sample / Guided | leave |

## Channels

| Channel | Path | Payload field | Mode / door | Leak class | Owner |
|---------|------|---------------|-------------|------------|-------|
| Email to sponsor | `archlucid-ui/src/components/use-email-run-to-sponsor-banner.ts` | Career artifact honesty + sponsor-proof readiness + rehearsal mailto gate | Mode + CG-019 Career/Rehearsal door stamp | **covered** | CG-029 |
| Email to sponsor | `archlucid-ui/src/components/EmailRunToSponsorBanner.tsx` | CTA chrome | Inherits banner hook | covered | CG-029 |
| Email to sponsor | `archlucid-ui/src/components/EmailRunToSponsorExportActions.tsx` | PDF / mark-sent | Honesty block reasons | covered | CG-029 |
| Weekly digest | `ArchLucid.Application/ExecDigest/ExecDigestComposition.cs` | Week label, committed counts, highlighted runs | **No** structural Mode or door | **bypass** | CG-037 |
| Weekly digest | `ArchLucid.Application/ExecDigest/ExecDigestCompositionMarkdownFormatter.cs` | Markdown body | No rehearsal line | **bypass** | CG-037 |
| Weekly digest | `ArchLucid.Application/Notifications/Email/ExecDigestEmailDispatcher.cs` | Subject `{product} weekly digest` | Sealed-hash guard only | related | CG-037 |
| Weekly digest | `ArchLucid.Application/SponsorDigest/SponsorDigestWeeklyDeliveryScanner.cs` | Per-tenant send | No Mode | **bypass** | CG-037 |
| Board pack | `ArchLucid.Application/Pilots/BoardPackPdfBuilder.cs` | Digest markdown + value-report | Completeness watermarks, not rehearsal | assumed-banner (CG-003) | CG-037 / CG-042 |
| ITSM ticket | `ArchLucid.Application/Integrations/Itsm/Outbound/ItsmOutboundIssueCreationService.cs` | Finding title/body to Jira/ServiceNow | Sealed-hash on finding run; **no** Mode/door | **bypass** | CG-038 |
| ITSM ticket | `ArchLucid.Api/Controllers/Integrations/ItsmOutboundIssuesController.cs` | `POST …/itsm/outbound/issues` | Same | **bypass** | CG-038 |
| ITSM ticket | `archlucid-ui/src/components/itsm/ItsmOutboundCreateIssueDialog.tsx` | Operator create dialog | No door | **bypass** | CG-038 |
| Webhook | `ArchLucid.Core/Integration/IntegrationWebhookPayloadSamples.cs` | Event payloads (finding verification, etc.) | Manifest hash; **no** rehearsal door | **bypass** | CG-036 / CG-094 |
| Alerts | `ArchLucid.Application/Advisory/AdvisoryScanRunner.cs` | Alert fire from advisory scan | Run stamp via `AlertCareerHonestyApplicator` on persist | **covered** | CG-036 |
| Alerts | `ArchLucid.Application/Alerts/AlertActionLoopReader.cs` | Delivery attempts | Stamped alert copy from persist path | **covered** | CG-036 |
| Alerts | `ArchLucid.Persistence/Alerts/AlertService.cs` | Simple alert persist/deliver | `Rehearsal —` title + body disclaimer | **covered** | CG-036 |
| Alerts | `ArchLucid.Persistence/Alerts/CompositeAlertService.cs` | Composite alert persist/deliver | Same | **covered** | CG-036 |
| Alerts | `archlucid-ui/src/components/alerts/AlertsInboxAlertCard.tsx` | Inbox row | Rehearsal chip on Working | **covered** | CG-036 |

## Quoteable gaps

1. Digest composition has no `structuralExecutionMode`. A Simulator week still reads as committed Career activity.
2. ITSM issues copy finding text into Jira/ServiceNow with sealed-hash only — rehearsal is not a ticket field.
3. Email-to-sponsor calls `evaluateCareerArtifactHonesty` with door stamp (CG-029). Rehearsal compose forces `[Rehearsal]` subject prefix and TB-2005 ack before send.

## Shrink rules

1. **Do not change payloads** from this inventory.
2. New unlabeled Working outbound channels fail Vitest until listed.
3. Ratchet: `career-gravity-outbound-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host `AgentExecution:Mode` default Simulator.
- Live presence / finding-comment chat.
- G-REAL-06.
