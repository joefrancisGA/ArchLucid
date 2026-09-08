using ArchLucid.ArtifactSynthesis.FindingVerification;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationReportExportApplicationService(
    IAppendOnlyFindingVerificationReportRepository verificationReportRepository,
    IAuthorityQueryService authorityQueryService,
    IFindingVerificationReportExportService exportService) : IFindingVerificationReportExportApplicationService
{
    private readonly IAppendOnlyFindingVerificationReportRepository _verificationReportRepository =
        verificationReportRepository ?? throw new ArgumentNullException(nameof(verificationReportRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IFindingVerificationReportExportService _exportService =
        exportService ?? throw new ArgumentNullException(nameof(exportService));

    public Task<byte[]> ExportMarkdownAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default) =>
        ExportAsync(scope, runId, reportId, _exportService.RenderMarkdown, cancellationToken);

    public Task<byte[]> ExportDocxAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default) =>
        ExportAsync(scope, runId, reportId, _exportService.RenderDocx, cancellationToken);

    private async Task<byte[]> ExportAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        Func<FindingVerificationReportDocumentModel, byte[]> render,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(render);

        FindingVerificationReportDocumentModel model =
            await BuildDocumentModelAsync(scope, runId, reportId, cancellationToken);

        return render(model);
    }

    private async Task<FindingVerificationReportDocumentModel> BuildDocumentModelAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken)
    {
        FindingVerificationReportRecord? record =
            await _verificationReportRepository.GetByIdAsync(scope, reportId, cancellationToken);

        if (record is null || record.RunId != runId)
        {
            throw new FindingVerificationReportNotFoundException(runId, reportId);
        }

        Dictionary<string, Finding> findingsById =
            await LoadFindingMetadataAsync(scope, runId, record.SourceFindingsSnapshotId, cancellationToken);

        FindingVerificationReportConfirmedRateSummary summary =
            FindingVerificationReportConfirmedRateCalculator.Compute(record.Results);

        List<FindingVerificationReportFindingRow> rows = record.Results
            .Select(result =>
            {
                findingsById.TryGetValue(result.FindingId, out Finding? finding);

                return new FindingVerificationReportFindingRow
                {
                    FindingId = result.FindingId,
                    Title = finding?.Title,
                    Severity = finding?.Severity.ToString(),
                    Status = result.Status.ToString(),
                    TraceText = result.TraceText,
                };
            })
            .ToList();

        return new FindingVerificationReportDocumentModel
        {
            ReportId = record.ReportId,
            RunId = record.RunId,
            SourceManifestHash = record.SourceManifestHash,
            ReportHash = record.ReportHash,
            VerificationFindingsSnapshotId = record.VerificationFindingsSnapshotId,
            CreatedUtc = record.CreatedUtc,
            Summary = summary,
            Findings = rows,
        };
    }

    private async Task<Dictionary<string, Finding>> LoadFindingMetadataAsync(
        ScopeContext scope,
        Guid runId,
        Guid sourceFindingsSnapshotId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.FindingsSnapshot is null
            || detail.FindingsSnapshot.FindingsSnapshotId != sourceFindingsSnapshotId)
        {
            return new Dictionary<string, Finding>(StringComparer.OrdinalIgnoreCase);
        }

        Dictionary<string, Finding> findingsById = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in detail.FindingsSnapshot.Findings)
        {
            if (!string.IsNullOrWhiteSpace(finding.FindingId))
            {
                findingsById[finding.FindingId] = finding;
            }
        }

        foreach (Finding finding in detail.FindingsSnapshot.ChecklistCoverage)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
            {
                continue;
            }

            findingsById.TryAdd(finding.FindingId, finding);
        }

        return findingsById;
    }
}
