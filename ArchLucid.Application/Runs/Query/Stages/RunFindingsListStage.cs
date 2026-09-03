using ArchLucid.Application.Findings;
using ArchLucid.Application.Http;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Query.Stages;

public sealed class RunFindingsListStage(
    IRunRepository authorityRunRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    RunFindingExternalTrackingEnrichmentService runFindingExternalTrackingEnrichmentService,
    IScopeContextProvider scopeContextProvider) : IRunFindingsListStage
{
    public async Task<RunFindingsListQueryResult> ListRunFindingsAsync(
        string runId,
        string? orderBy,
        int? take,
        int? cursorSortOrder,
        int? cursorPriorityRank,
        Guid? cursorFindingRecordId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return new RunFindingsListQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "runId is required."
            };
        }

        if (!AuthorityRunIdentifier.TryParse(runId, out Guid runGuid))
        {
            return new RunFindingsListQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Persistence.Models.RunRecord? run = await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
        {
            return new RunFindingsListQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' has no findings snapshot."
            };
        }

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
            AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run),
            runId);

        bool orderByPriority = RunFindingsListResponseBuilder.IsPriorityOrder(orderBy);
        int pageTake = take ?? FindingPagination.DefaultTake;
        string findingsFingerprint = RunFindingsListResponseBuilder.BuildRequestFingerprint(
            snapshotId,
            orderByPriority,
            pageTake,
            cursorSortOrder,
            cursorPriorityRank,
            cursorFindingRecordId);
        string findingsEtag = ConditionalGetNegotiation.FromRowVersionWithFingerprint(run.RowVersion, findingsFingerprint);

        FindingRecordMetadataPage page = await findingsSnapshotRepository.ListFindingRecordsKeysetAsync(
            scope,
            snapshotId,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            severity: null,
            category: null,
            findingType: null,
            pageTake,
            orderByPriority,
            cancellationToken);

        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId =
            await runFindingExternalTrackingEnrichmentService.LoadForFindingsAsync(
                scope.TenantId,
                snapshotId,
                RunFindingsListResponseBuilder.CollectFindingIds(page),
                cancellationToken);

        RunFindingsListResponse body = RunFindingsListResponseBuilder.Build(
            runId,
            orderByPriority,
            page,
            trackingByFindingId);

        return new RunFindingsListQueryResult
        {
            Outcome = RunFindingsQueryOutcome.Success,
            Response = body,
            Etag = findingsEtag
        };
    }
}
