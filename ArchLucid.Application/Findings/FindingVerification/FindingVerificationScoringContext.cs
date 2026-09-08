using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationScoringContext
{
    public Guid? VerificationFindingsSnapshotId
    {
        get;
        init;
    }

    public FindingsSnapshot? VerificationSnapshot
    {
        get;
        init;
    }

    public CrossReviewFindingCorrelationResult Correlation
    {
        get;
        init;
    } = new();

    public IReadOnlyDictionary<string, FindingDisposition> Dispositions
    {
        get;
        init;
    } = new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase);
}
