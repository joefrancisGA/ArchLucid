using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPatternMatcherService
{
    Task<RemediationPatternMatchEvaluationResult> MatchFindingAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternMatchEvaluationResult> TryRecordProposedMatchAsync(
        ScopeContext scope,
        Guid findingId,
        Guid patternId,
        string version,
        RemediationPatternMatchKind proposedKind,
        RemediationPatternMatchSource matchSource,
        string explainText,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationPatternMatchEvaluationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? FindingId
    {
        get;
        init;
    }

    public RemediationPatternMatchKind MatchKind
    {
        get;
        init;
    } = RemediationPatternMatchKind.NoMatch;

    public RemediationPatternMatchResultRecord? PrimaryMatch
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationPatternMatchResultRecord> Candidates
    {
        get;
        init;
    } = [];

    public RemediationPatternMatchConflictRecord? Conflict
    {
        get;
        init;
    }

    public IReadOnlyList<string> RejectionReasons
    {
        get;
        init;
    } = [];

    public string? ErrorMessage
    {
        get;
        init;
    }
}
