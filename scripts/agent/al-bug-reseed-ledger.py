#!/usr/bin/env python3
"""Insert hunt-ready hypotheses into AL_BUG_HUNT_LEDGER.md zone sections."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER = REPO_ROOT / "docs" / "library" / "AL_BUG_HUNT_LEDGER.md"

RESEED: dict[str, list[str]] = {
    "topology-proposal-merge": [
        "- [ ] (hunt-ready) `AgentTopologyProposalMergeGate.FilterValidatedProposals` with a Cost/Compliance agent whose `SanitizeProposal` strips every service/datastore/relationship but leaves `RequiredControls` — agent row vanishes from `validatedResults` when `ProposalIsEmpty` is false for controls-only yet the result id was never stored because an earlier empty-sanitize `continue` dropped the whole `AgentResult` (findings/claims lost at commit).",
        "- [ ] (hunt-ready) `AgentTopologyProposalGraphMerge.MergeEndpointAliasesInto` (`TryAdd` first-wins) with two agents mapping the same relationship endpoint key to different node ids in one batch — second agent's `MapRelationships` resolves to the first alias while `DropDanglingEdges` drops edges whose resolved ids are absent from `graph.Nodes` union `added`.",
        "- [ ] (hunt-ready) `AgentTopologyProposalGraphMerge` topology pass with `materializeNodes == true` and claimed services skip `AddDeclaredManifestServiceEndpointAliases` — a relationship referencing only a pre-registered merge-gate key not mirrored in node `Label`/`NodeId`/`svc-{name}` produces zero edges after `TopologyProposalRelationshipEdgeMapper.MapRelationships`.",
    ],
    "arm-terraform-source-ids": [
        "- [ ] (hunt-ready) `TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointAliases` (overlay path) with `ManifestService.ServiceId` = full ARM resource id and relationship `SourceId` = normalized ARM form only — overlay omits `AddArmResourceIdResolutionAliases` unlike `AddDeclaredManifestServiceEndpointAliases`, so edge creation fails when the inventoried node stores the id only in a differently indexed property field.",
        "- [ ] (hunt-ready) `TopologyProposalRelationshipEdgeMapper.TryResolveNodeId` with relationship endpoint = mixed-case ARM id — gate `EndpointKeyIsKnown` accepts via normalization, but `CrossAgentProposalConsistencyGate.FilterRelationshipOnlyProposals` uses raw `declaredBatchEndpointKeys.Contains(relationship.SourceId)` without ARM normalize, dropping batch-local relationships the merge gate would keep.",
        "- [ ] (hunt-ready) `TopologyProposalRelationshipEndpointIndex.AddGraphNodeSyntheticLabelEndpointKeys` on inventoried node `Category = Data/Storage` and `SourceId` not matching `LooksLikeTerraformServiceSourceId` — only `ds-{label}` is indexed; relationship `SourceId = svc-{label}` passes merge-gate inventory keys only when category is blank (both synthetics), and is filtered out for explicit datastore category nodes.",
    ],
    "auth-return-path": [
        "- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalize` with return path `/app/foo/../bar` or `/signin/../../other` — passes `TryNormalizeRelativePath` (no `..` segment rejection/canonicalization) but browsers normalize to `/bar` or `/other`, yielding an unintended post-login destination outside the intended subtree.",
        "- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalizeAfterPercentDecoding` with path that decodes across multiple passes to introduce `//` or `\\` only after the eighth `%` decode — loop capped at `MaxPercentDecodePasses = 8` may return a normalized relative path while a ninth decode would expose protocol-relative traversal blocked in `ContainsResidualEncodedTraversal`.",
        "- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalize` with path containing percent-encoded slash homoglyphs (e.g. fullwidth solidus) not present before decoding — initial `ContainsSlashHomoglyph` misses the literal; partially decoded `working` strings that still encode the homoglyph may return null inconsistently depending on pass count.",
    ],
    "email-otp-auth": [
        "- [ ] (hunt-ready) `EmailOtpAuthController.VerifyAsync` when `result.TenantId`/`WorkspaceId` are null but JWT issuance falls back to `TrialLocalJwtScopeDefaults.Resolve()` — access token carries default tenant/workspace while `EmailOtpVerifyResponse.TenantId`/`WorkspaceId` echo the null `result.*` fields, desyncing client routing from token claims.",
        "- [ ] (hunt-ready) `EmailOtpAuthController.VerifyAsync` audit on every verify attempt — logs `AuditEventTypes.EmailOtpCodeRequested` with channel `email_otp_verify_http` instead of a verification-failure/success event, conflating challenge and verify telemetry.",
        "- [ ] (hunt-ready) `EmailOtpAuthService.VerifyCodeAsync` on `RequireEnterpriseSso` domain decision — calls `FailWithAuditAsync(\"sso_required\", emailCorrelation: null)`, which returns `Failed()` without audit because `emailCorrelation` is null, so SSO-blocked verifies leave no `EmailOtpVerificationFailed` trail.",
    ],
    "commit-output-integrity": [
        "- [ ] (hunt-ready) `RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons` with `StructuralExecutionMode.Real`, `PilotStrict`, and empty `traces` — returns no blocking reasons, so `CommitOutputIntegrityService.EnsurePassOrThrowAsync` allows commit with zero execution traces recorded.",
        "- [ ] (hunt-ready) `RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons` with `StructuralExecutionMode` not equal to `Real` — ignores `QualityRejected` and `RecordedQualityGateOutcome.Rejected` on all traces, permitting commit despite recorded rejections in simulator/non-real runs.",
        "- [ ] (hunt-ready) `RealCommitAgentOutputQualityGateEvaluator` with latest-per-task trace showing `RecordedQualityGateOutcome != Rejected` but `QualityRejected == true` — still emits a blocking reason, so a patch that clears only `RecordedQualityGateOutcome` cannot un-block commit while `QualityRejected` remains set.",
    ],
    "storage-vs-data-category": [
        "- [ ] (hunt-ready) `AgentProposalStructuralPostProcessor.ShouldRetainDeclaredProposalRelationship` with proposal declaring a datastore plus relationship using `svc-{datastoreName}` — `CollectKnownEndpointKeys` indexes `ds-{name}` but not `svc-{name}` for manifest datastores; both endpoints appear declared under raw `Contains`, yet `RelationshipEndpointsAreKnown` drops the edge when both source/target match declared keys.",
        "- [ ] (hunt-ready) `CrossAgentProposalConsistencyGate.FilterRelationshipOnlyProposals` with relationship endpoints present only as normalized ARM ids — `declaredBatchEndpointKeys` may hold raw plus normalized keys from `AddArmResourceIdEndpointKeys`, but `Contains(relationship.SourceId)` on an unnormalized relationship id marks `sourceDeclaredInBatch` false and retains the row for later gates while `validationEndpointKeys` still fail `RelationshipEndpointsAreKnown`, silently stripping edges before merge.",
        "- [ ] (hunt-ready) `CrossAgentProposalConsistencyGate.TryAcceptRenameAliasService` accepting a rename — adds manifest endpoint keys to `claimedServiceEndpointKeys` after an earlier agent already claimed the stable id, but `declaredBatchEndpointKeys` was collected pre-claim without the renamed label, so downstream relationship-only proposals referencing only the new name miss batch declaration checks.",
    ],
    "tenant-erasure": [
        "- [ ] (hunt-ready) `TenantErasureQuarantineMiddleware.InvokeAsync` with authenticated tenant scope but `ITenantGetByIdRequestCache.GetByIdAsync` returning null — `tenant is null` bypasses quarantine and calls `next`, allowing API access for a tenant id that should be blocked when the record is missing or evicted.",
        "- [ ] (hunt-ready) `TenantErasureQuarantineMiddleware.InvokeAsync` with `context.User.Identity?.IsAuthenticated != true` — unauthenticated requests always pass through, so tenant-scoped anonymous routes that resolve `scope.TenantId` without auth are not quarantine-gated.",
        "- [ ] (hunt-ready) `TenantErasureCommandService.TryRestoreQuarantineAsync` after `TryOffboardTenantAsync` (which calls `SuspendTenantAsync`) — restore clears offboard/eligible timestamps via repository only and never reverses suspend, leaving a restored tenant still suspended while middleware stops blocking login/API quarantine.",
    ],
    "finding-inspect-sql": [
        "- [ ] (hunt-ready) `DapperFindingInspectReadRepository.ResolveRuleFields` with non-empty `AppliedRuleIdsJson` — always sets `DecisionRuleName` to the first rule id and deliberately ignores `firstRuleText` from the SQL join, so inspect UI shows id strings instead of trace rule labels.",
        "- [ ] (hunt-ready) `FindingInspectReadModelMapper.ParseFindingSeverity` with unknown or typo `Severity` column value — `Enum.TryParse` failure returns `FindingSeverity.Info`, downgrading Critical/High findings in inspect responses without surfacing parse failure.",
        "- [ ] (hunt-ready) `DapperFindingInspectReadRepository.GetInspectAsync` with `IncludeTypedPayload = false` — `BuildMetadataTypedPayload` duplicates `rationale` into both `rationale` and `whyThisMatters` keys, so clients expecting distinct fields from full `PayloadJson` see identical strings on first paint.",
    ],
    "orchestrator-transient-retry": [
        "- [ ] (hunt-ready) `OrchestratorTransientDbRetry.IsRetriableOrchestratorDbFailure` with `AggregateException` containing one transient and one permanent inner — returns true and retries the whole action, so permanent failures wrapped with transient SQL errors cause repeated full orchestration persists instead of immediate fail-fast.",
        "- [ ] (hunt-ready) `CommitRunTransientRetryPolicy.IsExhausted` with `elapsed >= RetryBudget` (20s) before `attempt >= MaxAttempts` (12) — commit retry loop stops while `OrchestratorTransientDbRetry` may still perform up to three 2s/4s/8s backoff retries per inner operation, producing asymmetric give-up between outer commit reconciliation and inner DB retry layers.",
        "- [ ] (hunt-ready) `CommitRunTransientRetryPolicy.RetryDelay` linear `150ms * attempt` with `ManifestReconcilePollDelay` using the same multiplier — under manifest contention, eight reconcile polls plus twelve commit attempts can exceed the 20s `RetryBudget` mid-poll, returning exhausted while a concurrent commit is still within reconcile window.",
    ],
    "outbound-webhook-dry-run": [
        "- [ ] (hunt-ready) `OutboundWebhookDryRunController.DryRunAsync` when `OutboundWebhookDryRunService` returns `TransportSucceeded = false` — still responds `200 OK` with `StatusCode = 0`, so API clients treating HTTP success as delivery success mark dead URLs as healthy unless they inspect `TransportSucceeded`.",
        "- [ ] (hunt-ready) `OutboundWebhookDryRunService.ProbeWithBodyAsync` with `sharedSecret` of whitespace — `trimmedSecret` becomes empty, skips `WebhookSignature` header, but controller audit records `hasSharedSecret` from raw `body.SharedSecret is { Length: > 0 }`, logging that a secret was provided when the probe was unsigned.",
        "- [ ] (hunt-ready) `OutboundWebhookDryRunService.ProbeWithBodyAsync` on large subscriber responses — reads the full body via `ReadAsStringAsync` before applying `PreviewMaxChars` truncation, so a probe to a URL returning a multi-megabyte body allocates the entire payload server-side even though only 8192 chars are returned.",
    ],
    "technology-ledger-merge": [
        "- [ ] (hunt-ready) `TechnologyLedgerAgentProposalMergePolicy.Resolve` with two agents proposing the same `ProviderFamily` but different `EvidenceRef` values — dedupe requires matching `ProviderFamily` before evidence-ref check; a second agent's distinct evidence ref may be dropped when family matches an earlier proposal, losing cross-agent evidence linkage at commit.",
        "- [ ] (hunt-ready) `TechnologyLedgerAgentProposalMergePolicy` inventory `Chosen` row with blank `ProviderFamily` — same-family skip gate treats blank family as matching any proposal family, suppressing agent-proposed technologies that should augment inventory when family is unset on the authoritative row.",
    ],
    "tenant-settings-sql": [
        "- [ ] (hunt-ready) `CachingTenantSettingsRepository.TryGetAsync` with hybrid-cache loader started before `UpsertAsync` completes — without generation-stamped keys, a slow loader can publish a miss after upsert (regression guard exists; verify delete/upsert bumps generation on all code paths including `DeleteAsync` and bulk invalidation).",
        "- [ ] (hunt-ready) `SqlTenantSettingsRepository.UpsertAsync` with concurrent readers on the same tenant id — read path uses snapshot isolation while upsert uses row lock; verify no path returns pre-upsert defaults when upsert commits between read start and materialization.",
    ],
    "llm-wallet": [
        "- [ ] (hunt-ready) `LlmTenantWalletService.ConsumeInternalAsync` when optimistic retries exhaust — verify settlement debit is re-queued rather than silently dropped (prior hit fixed re-queue; hunt sibling path `ReconcileOverageInternalAsync` for symmetric credit re-queue behavior under the same exhaustion branch).",
        "- [ ] (hunt-ready) `WalletController` balance read after concurrent consume — response may show stale available balance when read uses cached wallet row while consume transaction is in-flight; concrete input: two parallel POST consume plus GET balance without `If-None-Match`/version check.",
    ],
}


def insert_hypotheses(content: str, zone_id: str, rows: list[str]) -> str:
    pattern = rf"(## Zone: {re.escape(zone_id)}\n.*?### Hypotheses\n\n)(.*?)(\n---\n)"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        raise RuntimeError(f"zone section not found: {zone_id}")

    existing = match.group(2).rstrip()
    block = existing + "\n" + "\n".join(rows) + "\n"
    return content[: match.start(2)] + block + content[match.end(2) :]


def main() -> int:
    content = LEDGER.read_text(encoding="utf-8")
    for zone_id, rows in RESEED.items():
        content = insert_hypotheses(content, zone_id, rows)
    LEDGER.write_text(content, encoding="utf-8")
    print(f"Reseeded {len(RESEED)} zones with {sum(len(v) for v in RESEED.values())} hunt-ready hypotheses.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
