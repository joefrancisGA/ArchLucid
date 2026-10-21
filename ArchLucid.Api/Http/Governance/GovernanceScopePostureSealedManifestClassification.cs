namespace ArchLucid.Api.Http.Governance;

public enum GovernanceScopePostureSealedManifestClassification
{
    /// <summary>API layer runs <see cref="Application.Governance.Posture.GovernancePostureSealedManifestHashGuard" /> before the action.</summary>
    RequiresLatestCommittedRunSealedAtApi,

    /// <summary>Metadata, configuration, or aggregated reads that do not depend on latest committed run integrity.</summary>
    ExemptMetadataOrConfigRead,

    /// <summary>Run integrity enforced in application/services (not duplicated on the controller).</summary>
    EnforcedInApplicationLayer,
}
