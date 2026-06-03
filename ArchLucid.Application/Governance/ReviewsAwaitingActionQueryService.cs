using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IReviewsAwaitingActionQueryService" />
public sealed class ReviewsAwaitingActionQueryService(
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IAgentResultRepository agentResultRepository,
    IAgentResultDiffService agentResultDiffService) : IReviewsAwaitingActionQueryService
{
    private const int MaxRows = 50;

    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public async Task<GovernanceReviewsAwaitingActionResponse> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<ArchLucid.Persistence.Models.RunRecord> runs =
            await _runRepository.ListRecentInScopeAsync(scope, MaxRows * 4, cancellationToken).ConfigureAwait(false);

        List<GovernanceReviewAwaitingActionItem> items = [];

        foreach (ArchLucid.Persistence.Models.RunRecord run in runs.OrderByDescending(r => r.CompletedUtc ?? r.CreatedUtc))
        {
            if (items.Count >= MaxRows)
                break;

            if (run.GoldenManifestId.HasValue)
                continue;

            if (!string.Equals(
                    run.LegacyRunStatus,
                    nameof(ArchitectureRunStatus.ReadyForCommit),
                    StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
                continue;

            ArchLucid.Contracts.Requests.ArchitectureRequest? request =
                await _architectureRequestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
                    .ConfigureAwait(false);

            if (request is null)
                continue;

            bool isRecurrence = string.Equals(request.RequestSource, "recurrence", StringComparison.OrdinalIgnoreCase)
                                || run.ArchitectureRequestId.StartsWith("recurrence-", StringComparison.OrdinalIgnoreCase);

            if (!isRecurrence)
                continue;

            Guid? sourceRunId = TryParseSourceRunIdFromRequestId(run.ArchitectureRequestId);
            int newFindingCount = 0;

            if (sourceRunId.HasValue)
            {
                string leftRunId = sourceRunId.Value.ToString("N");
                string rightRunId = run.RunId.ToString("N");

                IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult> leftResults =
                    await _agentResultRepository.GetByRunIdAsync(scope, leftRunId, cancellationToken).ConfigureAwait(false);

                IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult> rightResults =
                    await _agentResultRepository.GetByRunIdAsync(scope, rightRunId, cancellationToken).ConfigureAwait(false);

                AgentResultDiffResult diff = _agentResultDiffService.Compare(leftRunId, leftResults, rightRunId, rightResults);
                (newFindingCount, _) = RecurrenceFindingDeltaCalculator.CountFindingDelta(diff);
            }

            items.Add(
                new GovernanceReviewAwaitingActionItem
                {
                    RunId = run.RunId,
                    Name = string.IsNullOrWhiteSpace(run.Description) ? run.ArchitectureRequestId : run.Description.Trim(),
                    ExecutedUtc = run.CompletedUtc.HasValue
                        ? new DateTimeOffset(DateTime.SpecifyKind(run.CompletedUtc.Value, DateTimeKind.Utc))
                        : null,
                    SourceRunId = sourceRunId ?? Guid.Empty,
                    NewFindingCount = newFindingCount,
                });
        }

        return new GovernanceReviewsAwaitingActionResponse { Items = items };
    }

    private static Guid? TryParseSourceRunIdFromRequestId(string requestId)
    {
        if (!requestId.StartsWith("recurrence-", StringComparison.OrdinalIgnoreCase))
            return null;

        string remainder = requestId["recurrence-".Length..];
        int dash = remainder.IndexOf('-', StringComparison.Ordinal);

        if (dash <= 0)
            return null;

        string hex = remainder[..dash];

        return Guid.TryParseExact(hex, "N", out Guid parsed) ? parsed : null;
    }
}
