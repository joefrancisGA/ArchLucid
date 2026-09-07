using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationService(
    IAuthorityQueryService authorityQueryService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IAppendOnlyFindingVerificationReportRepository verificationReportRepository,
    IAuditService auditService) : IFindingVerificationService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IAppendOnlyFindingVerificationReportRepository _verificationReportRepository =
        verificationReportRepository ?? throw new ArgumentNullException(nameof(verificationReportRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<FindingVerificationReportResponse> CreateReportAsync(
        ScopeContext scope,
        Guid runId,
        CreateFindingVerificationReportRequest request,
        string triggeredByUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(triggeredByUserId);

        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.FindingsSnapshot is null)
        {
            throw new FindingVerificationRunNotFoundException(runId);
        }

        string sourceManifestHash = detail.GoldenManifest?.ManifestHash ?? string.Empty;

        if (string.IsNullOrWhiteSpace(sourceManifestHash))
        {
            throw new FindingVerificationRunNotSealedException(runId);
        }

        FindingsSnapshot sourceSnapshot = detail.FindingsSnapshot;
        FindingsSnapshot? verificationSnapshot = null;

        if (request.VerificationFindingsSnapshotId is Guid verificationSnapshotId)
        {
            verificationSnapshot = await _findingsSnapshotRepository.GetByIdAsync(
                scope,
                verificationSnapshotId,
                cancellationToken);

            if (verificationSnapshot is null)
            {
                throw new FindingVerificationSnapshotNotFoundException(verificationSnapshotId);
            }
        }

        IReadOnlyList<Finding> findings = CollectPackageFindings(sourceSnapshot);

        List<FindingVerificationResultAppend> resultAppends = findings
            .Select(finding =>
            {
                (FindingVerificationStatus status, string traceText) = FindingVerificationSlice1Scorer.Score(
                    finding,
                    request.VerificationFindingsSnapshotId,
                    verificationSnapshot);

                return new FindingVerificationResultAppend
                {
                    FindingId = finding.FindingId,
                    Status = status,
                    TraceText = traceText,
                };
            })
            .ToList();

        FindingVerificationReportAppend append = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runId,
            SourceManifestHash = sourceManifestHash,
            SourceFindingsSnapshotId = sourceSnapshot.FindingsSnapshotId,
            VerificationFindingsSnapshotId = request.VerificationFindingsSnapshotId,
            TriggeredByUserId = triggeredByUserId.Trim(),
            Results = resultAppends,
        };

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingVerificationStarted,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    verificationFindingsSnapshotId = request.VerificationFindingsSnapshotId,
                    sourceManifestHash,
                }),
            },
            cancellationToken);

        FindingVerificationReportRecord record =
            await _verificationReportRepository.AppendAsync(append, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingVerificationCompleted,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    reportId = record.ReportId,
                    reportHash = record.ReportHash,
                    resultCount = record.Results.Count,
                }),
            },
            cancellationToken);

        return MapResponse(record);
    }

    private static IReadOnlyList<Finding> CollectPackageFindings(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<Finding> findings = snapshot.Findings.ToList();

        foreach (Finding checklistFinding in snapshot.ChecklistCoverage)
        {
            if (findings.Any(existing =>
                    string.Equals(existing.FindingId, checklistFinding.FindingId, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            findings.Add(checklistFinding);
        }

        return findings
            .OrderBy(finding => finding.FindingId, StringComparer.Ordinal)
            .ToList();
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
