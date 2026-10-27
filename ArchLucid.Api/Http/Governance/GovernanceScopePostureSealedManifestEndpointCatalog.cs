namespace ArchLucid.Api.Http.Governance;

/// <summary>
///     Authoritative classification for scope-posture sealed-manifest guards (latest committed project run).
///     API-layer guards must use <see cref="GovernanceScopePostureSealedManifestPreflight" /> only on
///     <see cref="GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi" /> entries.
/// </summary>
public static class GovernanceScopePostureSealedManifestEndpointCatalog
{
    public sealed record Entry(
        string Controller,
        string Action,
        GovernanceScopePostureSealedManifestClassification Classification,
        string Rationale);

    public static IReadOnlyList<Entry> All { get; } =
    [
        // --- Exempt: metadata / config / aggregated reads (no scope-posture guard at API) ---
        new("GovernanceEnvironmentCatalogController", "Get", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Administrator environment slot catalog is scope configuration, not sealed-run payload."),
        new("GovernanceEnvironmentCatalogController", "Replace", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Catalog replace mutates governance configuration independent of latest committed run hash."),
        new("GovernanceSetupController", "GetSetupGuideBundle", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Onboarding bundle lists effective policy packs and alert routes only."),
        new("GovernanceResolutionController", "Resolve", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Hierarchical resolver output is assignment metadata, not golden manifest content."),
        new("GovernanceCoverageController", "GetScopeCoverage", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Coverage assignments are policy-pack metadata."),
        new("GovernanceController", "GetDashboard", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Aggregated governance insights are not latest-run manifest reads."),
        new("GovernanceController", "GetComplianceDriftTrend", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Compliance drift trend aggregates approval history."),
        new("GovernanceController", "BatchReviewApprovalRequests", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Batch review uses per-approval run guards inside the workflow."),
        new("GovernancePreviewController", "CompareEnvironments", GovernanceScopePostureSealedManifestClassification.ExemptMetadataOrConfigRead, "Environment comparison seals per activation inside the preview service."),

        // --- Application layer ---
        new("GovernancePostureController", "GetPosture", GovernanceScopePostureSealedManifestClassification.EnforcedInApplicationLayer, "ArchitecturePostureService.EnsureLatestCommittedRunSealedOrThrowAsync before posture read model."),

        // --- Requires API opt-in (attribute + preflight) ---
        new("PolicyPacksController", "Create", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Policy pack creation mutates governance posture."),
        new("PolicyPacksController", "Publish", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Policy pack publish mutates governance posture."),
        new("PolicyPacksController", "DeletePack", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Policy pack delete mutates governance posture."),
        new("PolicyPacksController", "DuplicatePack", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Policy pack duplicate mutates governance posture."),
        new("PolicyPacksController", "Assign", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Policy pack assignment mutates governance posture tied to committed architecture."),
        new("PolicyPacksController", "ArchiveAssignment", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Assignment archive mutates governance posture."),
        new("PolicyPacksController", "SetAssignmentEnabled", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Assignment enablement mutates governance posture."),
        new("PolicyPacksController", "SetAssignmentOrganizationRequired", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Assignment organization flag mutates governance posture."),
        new("PolicyPacksController", "PromoteCatalogEntry", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Catalog promotion mutates effective governance catalog."),
        new("PolicyPacksController", "DemoteCatalogEntry", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Catalog demotion mutates effective governance catalog."),
        new("GovernanceStickinessController", "GetRiskRegister", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Risk register surfaces committed-run disposition rows."),
        new("GovernanceStickinessController", "GetAssignedToMeFindingsCount", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Register counts derive from sealed findings inventory."),
        new("GovernanceStickinessController", "GetReviewsAwaitingAction", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Review queue reads committed-run examination state."),
        new("GovernanceStickinessController", "GetDecisionsNeededSummary", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Decision summary aggregates run-linked governance rows; latest-run preflight plus per-row register and active-waiver sealing fail closed with HTTP 409 (no partial totals), matching GET risk-exceptions list parity."),
        new("GovernanceStickinessController", "GetFindingsRegistersBundle", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Bundled registers project sealed findings."),
        new("GovernanceStickinessController", "ListRecurrenceSchedules", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Recurrence schedules reference committed source runs."),
        new("GovernanceStickinessController", "GetDecisionRegister", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Decision register lists run-backed disposition rows."),
        new("GovernanceStickinessController", "GetRealizedValueAttestation", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Attestation read is tied to committed architecture value evidence."),
        new("GovernanceStickinessController", "UpsertRealizedValueAttestation", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Attestation write mutates run-linked value evidence."),
        new("PilotsBoardPackController", "PostBoardPackPdf", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Board pack PDF embeds committed-run digest and value metrics."),
        new("PilotsController", "GetRecentDeltas", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Recent pilot deltas summarize latest committed run deltas."),
        new("ArchitecturesController", "PatchArchitecture", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Identity mutation pins architecture to committed run lineage."),
        new("ArchitecturesController", "AttachInventoryBinding", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Inventory binding mutates architecture identity against committed run."),
        new("ArchitecturesController", "DetachInventoryBinding", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Inventory detach mutates architecture identity against committed run."),
        new("ArchitecturesController", "PutArchitectureShare", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Share grant mutates architecture identity under committed run."),
        new("ArchitecturesController", "RevokeArchitectureShare", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Share revoke mutates architecture identity under committed run."),
        new("ArchitecturesController", "PatchArchitectureRestrictToShares", GovernanceScopePostureSealedManifestClassification.RequiresLatestCommittedRunSealedAtApi, "Restrict-to-shares mutates architecture identity under committed run."),
    ];
}
