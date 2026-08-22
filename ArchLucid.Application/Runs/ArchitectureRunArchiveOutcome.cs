namespace ArchLucid.Application.Runs;

/// <summary>Result of a tenant-scoped soft-archive attempt on one architecture review run.</summary>
public enum ArchitectureRunArchiveOutcome
{
    Archived,
    AlreadyArchived,
    NotFound,
    SealedReviewBlocked,
}
