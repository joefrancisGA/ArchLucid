using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Mutes coverage findings resolved by operator clarification answers.
/// </summary>
public interface IClarificationResolvedFindingMuter
{
    Task<int> MuteResolvedAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyDictionary<string, string> appliedAnswers,
        CancellationToken cancellationToken = default);
}

public sealed class ClarificationResolvedFindingMuter(
    IReviewClarificationQuestionService clarificationQuestionService,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository) : IClarificationResolvedFindingMuter
{
    private readonly IReviewClarificationQuestionService _clarificationQuestionService =
        clarificationQuestionService ?? throw new ArgumentNullException(nameof(clarificationQuestionService));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    public async Task<int> MuteResolvedAsync(
        ScopeContext scope,
        Guid runId,
        IReadOnlyDictionary<string, string> appliedAnswers,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(appliedAnswers);

        if (appliedAnswers.Count == 0 || runId == Guid.Empty)
            return 0;

        ReviewClarificationQuestionsResponse questions = await _clarificationQuestionService
            .GetQuestionsAsync(scope, runId, priorRunId: null, cancellationToken)
            .ConfigureAwait(false);

        HashSet<string> appliedQuestionIds = appliedAnswers.Keys
            .Select(static key => key.Trim())
            .Where(static key => key.Length > 0)
            .ToHashSet(StringComparer.Ordinal);

        List<string> sourceFindingIds = questions.Questions
            .Where(question => appliedQuestionIds.Contains(question.QuestionId))
            .Select(question => question.SourceFindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (sourceFindingIds.Count == 0)
            return 0;

        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return 0;

        FindingsSnapshot? snapshot = await _findingsSnapshotRepository
            .GetByIdAsync(scope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (snapshot is null)
            return 0;

        int muted = 0;

        foreach (Finding finding in snapshot.Findings)
        {
            if (finding.IsMuted || string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            if (!sourceFindingIds.Contains(finding.FindingId))
                continue;

            finding.IsMuted = true;
            finding.MuteReason = "Resolved by operator clarification answer.";
            muted++;
        }

        if (muted == 0)
            return 0;

        await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        return muted;
    }
}
