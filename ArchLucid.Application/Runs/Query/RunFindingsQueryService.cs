using System.Globalization;
using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Http;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Traceability;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Query;

/// <inheritdoc cref="IRunFindingsQueryService"/>
public sealed class RunFindingsQueryService(
    IRunDetailQueryService runDetailQueryService,
    IRunRepository authorityRunRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    RunFindingExternalTrackingEnrichmentService runFindingExternalTrackingEnrichmentService,
    IFindingEvidenceChainService findingEvidenceChainService,
    IFindingInspectReadRepository findingInspectReadRepository,
    IFindingTrustLabelMapper findingTrustLabelMapper,
    IReasoningSummaryBuilder reasoningSummaryBuilder,
    IScopeContextProvider scopeContextProvider,
    ExportFormatterService exportFormatter) : IRunFindingsQueryService
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

    public async Task<RunFindingsCsvExportQueryResult> ExportRunFindingsCsvAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runId, cancellationToken);

        if (detail is null)
        {
            return new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Run '{runId}' was not found."
            };
        }

        if (!string.IsNullOrWhiteSpace(detail.Run.CurrentManifestVersion) && detail.Manifest is null)
        {
            return new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.ManifestNotFound,
                ProblemDetail = $"Manifest referenced by run '{runId}' could not be found."
            };
        }

        if (!detail.IsCommitted)
        {
            return new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.Conflict,
                ProblemDetail = "Export requires a finalized review with a committed architecture snapshot."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? findingsSnapshotId = null;

        if (AuthorityRunIdentifier.TryParse(runId, out Guid runGuidForSnapshot))
        {
            Persistence.Models.RunRecord? runRecord =
                await authorityRunRepository.GetByIdAsync(scope, runGuidForSnapshot, cancellationToken);

            findingsSnapshotId = runRecord?.FindingsSnapshotId;
        }

        IReadOnlyList<string> findingIds = ArchitectureRunFindingsCsvFormatter.CollectFindingIds(detail);

        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> trackingByFindingId =
            await runFindingExternalTrackingEnrichmentService.LoadForFindingsAsync(
                scope.TenantId,
                findingsSnapshotId,
                findingIds,
                cancellationToken);

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail, trackingByFindingId);
        int findingCount = ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail);

        Guid? auditRunId = AuthorityRunIdentifier.TryParse(runId, out Guid runGuidForAudit) ? runGuidForAudit : null;

        DateTime utcStamp = TimeProvider.System.GetUtcNow().UtcDateTime;
        string timeSegment = exportFormatter.FormatAttachmentSegmentUtc(utcStamp);
        string safeRunStem = auditRunId.HasValue
            ? runGuidForAudit.ToString("N", CultureInfo.InvariantCulture)
            : AuthorityRunIdentifier.SanitizeForFileStem(runId);

        string downloadName = $"architecture-run-{safeRunStem}-findings-{timeSegment}.csv";

        return new RunFindingsCsvExportQueryResult
        {
            Outcome = RunFindingsQueryOutcome.Success,
            CsvBytes = Encoding.UTF8.GetBytes(csv),
            DownloadName = downloadName,
            FindingCount = findingCount,
            AuditRunId = auditRunId
        };
    }

    public async Task<FindingEvidenceChainQueryResult> GetFindingEvidenceChainAsync(
        string runId,
        string findingId,
        CancellationToken cancellationToken)
    {
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

    public async Task<FindingInspectQueryResult> GetFindingInspectForRunAsync(
        string runId,
        string findingId,
        bool includeTypedPayload,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Run id is required."
            };
        }

        if (string.IsNullOrWhiteSpace(findingId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Finding id is required."
            };
        }

        if (findingId.Trim().Length > 64)
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.BadRequest,
                ProblemDetail = "Finding id exceeds maximum length (64)."
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        FindingInspectReadOptions options = includeTypedPayload
            ? FindingInspectReadOptions.Full
            : FindingInspectReadOptions.MetadataOnly;

        FindingInspectResponse? body =
            await findingInspectReadRepository.GetInspectAsync(scope, findingId.Trim(), cancellationToken, options);

        if (body is null)
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Finding '{findingId.Trim()}' was not found in the current scope."
            };
        }

        if (!AuthorityRunIdentifier.Matches(runId.Trim(), body.RunId))
        {
            return new FindingInspectQueryResult
            {
                Outcome = RunFindingsQueryOutcome.NotFound,
                ProblemDetail = $"Finding '{findingId.Trim()}' was not found for run '{runId.Trim()}'."
            };
        }

        return new FindingInspectQueryResult
        {
            Outcome = RunFindingsQueryOutcome.Success,
            Response = FindingInspectTrustLabelEnricher.Enrich(
                body.WithReasoningSummaryFromBuilder(reasoningSummaryBuilder),
                findingTrustLabelMapper)
        };
    }
}
