using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationReportQueryService(
    IAppendOnlyFindingVerificationReportRepository verificationReportRepository) : IFindingVerificationReportQueryService
{
    private readonly IAppendOnlyFindingVerificationReportRepository _verificationReportRepository =
        verificationReportRepository ?? throw new ArgumentNullException(nameof(verificationReportRepository));

    public async Task<FindingVerificationReportResponse?> GetReportAsync(
        ScopeContext scope,
        Guid runId,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        FindingVerificationReportRecord? record =
            await _verificationReportRepository.GetByIdAsync(scope, reportId, cancellationToken);

        if (record is null || record.RunId != runId)
        {
            return null;
        }

        return MapResponse(record);
    }

    public async Task<IReadOnlyList<FindingVerificationReportSummaryResponse>> ListReportsByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<FindingVerificationReportRecord> records =
            await _verificationReportRepository.ListByRunIdAsync(scope, runId, cancellationToken);

        return records
            .Select(MapSummary)
            .ToList();
    }

    public async Task<IReadOnlyList<ArtifactDescriptor>> ListArtifactDescriptorsByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<FindingVerificationReportRecord> records =
            await _verificationReportRepository.ListByRunIdAsync(scope, runId, cancellationToken);

        return records
            .Select(FindingVerificationReportArtifactDescriptorMapper.ToDescriptor)
            .ToList();
    }

    private static FindingVerificationReportSummaryResponse MapSummary(FindingVerificationReportRecord record)
    {
        FindingVerificationReportConfirmedRateSummary summary =
            FindingVerificationReportConfirmedRateCalculator.Compute(record.Results);

        return new FindingVerificationReportSummaryResponse
        {
            ReportId = record.ReportId,
            RunId = record.RunId,
            SourceManifestHash = record.SourceManifestHash,
            ReportHash = record.ReportHash,
            VerificationFindingsSnapshotId = record.VerificationFindingsSnapshotId,
            CreatedUtc = record.CreatedUtc,
            ResultCount = record.Results.Count,
            ConfirmedRate = summary.ConfirmedRate,
        };
    }

    private static FindingVerificationReportResponse MapResponse(FindingVerificationReportRecord record) =>
        new()
        {
            ReportId = record.ReportId,
            RunId = record.RunId,
            SourceManifestHash = record.SourceManifestHash,
            ReportHash = record.ReportHash,
            VerificationFindingsSnapshotId = record.VerificationFindingsSnapshotId,
            CreatedUtc = record.CreatedUtc,
            Results = record.Results
                .Select(result => new FindingVerificationResultResponse
                {
                    FindingId = result.FindingId,
                    Status = result.Status,
                    TraceText = result.TraceText,
                })
                .ToList(),
        };
}
