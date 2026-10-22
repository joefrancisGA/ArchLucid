using System.Globalization;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Http;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Query.Stages;

public sealed class RunFindingsCsvExportStage(
    IRunDetailQueryService runDetailQueryService,
    IRunRepository authorityRunRepository,
    RunFindingExternalTrackingEnrichmentService runFindingExternalTrackingEnrichmentService,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ExportFormatterService exportFormatter) : IRunFindingsCsvExportStage
{
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

        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId);
        }
        catch (ConflictException ex)
        {
            return new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.Conflict,
                ProblemDetail = ex.Message
            };
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        try
        {
            await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return new RunFindingsCsvExportQueryResult
            {
                Outcome = RunFindingsQueryOutcome.Conflict,
                ProblemDetail = ex.Message
            };
        }
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
}
