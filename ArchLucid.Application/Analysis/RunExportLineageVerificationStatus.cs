namespace ArchLucid.Application.Analysis;

/// <summary>Outcome of comparing a recomputed golden manifest hash to the commit-time audit anchor.</summary>
public enum RunExportLineageVerificationStatus
{
    Match,
    Mismatch,
    NotAttested
}
