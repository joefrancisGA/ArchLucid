using ArchLucid.Application.Explanation;
using ArchLucid.Application.Runs.Query.Stages;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Query;

/// <inheritdoc cref="IRunFindingsQueryService"/>
public sealed class RunFindingsQueryService(
    IRunFindingsListStage listStage,
    IRunFindingsCsvExportStage csvExportStage,
    IRunFindingsInspectStage inspectStage,
    IRunRepository authorityRunRepository,
    IFindingEvidenceChainService findingEvidenceChainService,
    IScopeContextProvider scopeContextProvider) : IRunFindingsQueryService
{
    public Task<RunFindingsListQueryResult> ListRunFindingsAsync(
        string runId,
        string? orderBy,
        int? take,
        int? cursorSortOrder,
        int? cursorPriorityRank,
        Guid? cursorFindingRecordId,
        CancellationToken cancellationToken) =>
        listStage.ListRunFindingsAsync(
            runId,
            orderBy,
            take,
            cursorSortOrder,
            cursorPriorityRank,
            cursorFindingRecordId,
            cancellationToken);

    public Task<RunFindingsCsvExportQueryResult> ExportRunFindingsCsvAsync(
        string runId,
        CancellationToken cancellationToken) =>
        csvExportStage.ExportRunFindingsCsvAsync(runId, cancellationToken);

    public async Task<FindingEvidenceChainQueryResult> GetFindingEvidenceChainAsync(
        string runId,
        string findingId,
        CancellationToken cancellationToken)
    {
        RunFindingsQueryOutcome? lifecycleBlock = await RunFindingsLifecycleGuard.TryBlockWhenLifecycleIncompleteAsync(
            runId,
            authorityRunRepository,
            scopeContextProvider,
            cancellationToken);

        if (lifecycleBlock is not null)
        {
            return new FindingEvidenceChainQueryResult
            {
                Outcome = lifecycleBlock.Value,
                ProblemDetail = lifecycleBlock.Value == RunFindingsQueryOutcome.Conflict
                    ? $"Evidence chain blocked for run '{runId}': authority lifecycle must be Complete."
                    : $"Run '{runId}' was not found."
            };
        }

        FindingEvidenceChainResponse? chain =
            await findingEvidenceChainService.BuildAsync(runId, findingId, cancellationToken);

        if (chain is null)
        {
            return new FindingEvidenceChainQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Evidence chain is not available for run '{runId}' and finding '{findingId}'."
            };
        }

        return new FindingEvidenceChainQueryResult
        {
            Outcome = RunFindingsQueryOutcome.Success,
            Chain = chain
        };
    }

    public Task<FindingInspectQueryResult> GetFindingInspectForRunAsync(
        string runId,
        string findingId,
        bool includeTypedPayload,
        CancellationToken cancellationToken) =>
        inspectStage.GetFindingInspectForRunAsync(runId, findingId, includeTypedPayload, cancellationToken);
}
