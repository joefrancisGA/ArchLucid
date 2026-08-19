namespace ArchLucid.Core.Runs.Finalization;

/// <summary>Known failure modes surfaced by <c>dbo.sp_FinalizeManifest</c>.</summary>
public enum ManifestFinalizationFaultKind
{
    RunNotFoundOrScope = 50001,
    CommittedDifferentManifest = 50002,
    BadRunStatus = 50003,
    FindingsMismatch = 50004,
    ArtifactMismatch = 50005,
    ConcurrencyConflict = 50006,
}
