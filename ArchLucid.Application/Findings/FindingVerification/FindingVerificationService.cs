using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationService(
    IAuthorityQueryService authorityQueryService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IAppendOnlyFindingVerificationReportRepository verificationReportRepository,
    ICrossReviewFindingCorrelationService correlationService,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IFindingVerificationScorer findingVerificationScorer,
    IAuditService auditService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<FindingVerificationService> logger) : IFindingVerificationService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IAppendOnlyFindingVerificationReportRepository _verificationReportRepository =
        verificationReportRepository ?? throw new ArgumentNullException(nameof(verificationReportRepository));

    private readonly ICrossReviewFindingCorrelationService _correlationService =
        correlationService ?? throw new ArgumentNullException(nameof(correlationService));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IFindingVerificationScorer _findingVerificationScorer =
        findingVerificationScorer ?? throw new ArgumentNullException(nameof(findingVerificationScorer));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<FindingVerificationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<FindingVerificationCreateReportResult> CreateReportAsync(
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

        FindingVerificationReportRecord? existingReport =
            await _verificationReportRepository.TryGetLatestByPackagePairAsync(
                scope,
                runId,
                sourceSnapshot.FindingsSnapshotId,
                request.VerificationFindingsSnapshotId,
                cancellationToken);

        if (existingReport is not null)
        {
            return new FindingVerificationCreateReportResult
            {
                Response = MapResponse(existingReport),
                CreatedNewReport = false,
            };
        }

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
        CrossReviewFindingCorrelationResult correlation = BuildCorrelation(sourceSnapshot, verificationSnapshot);
        IReadOnlyDictionary<string, FindingDisposition> dispositions =
            await LoadDispositionsAsync(scope, correlation.UnmatchedLeftFindingIds, cancellationToken);

        FindingVerificationScoringContext scoringContext = new()
        {
            VerificationFindingsSnapshotId = request.VerificationFindingsSnapshotId,
            VerificationSnapshot = verificationSnapshot,
            Correlation = correlation,
            Dispositions = dispositions,
        };

        List<FindingVerificationResultAppend> resultAppends = findings
            .Select(finding =>
            {
                (FindingVerificationStatus status, string traceText) =
                    _findingVerificationScorer.Score(finding, scoringContext);

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

        await FindingVerificationIntegrationEventPublishing.TryPublishCompletedAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions,
            _logger,
            scope,
            record,
            cancellationToken);

        return new FindingVerificationCreateReportResult
        {
            Response = MapResponse(record),
            CreatedNewReport = true,
        };
    }

    private CrossReviewFindingCorrelationResult BuildCorrelation(
        FindingsSnapshot sourceSnapshot,
        FindingsSnapshot? verificationSnapshot)
    {
        if (verificationSnapshot is null)
        {
            return new CrossReviewFindingCorrelationResult();
        }

        IReadOnlyList<ArchitectureFinding> sourceFindings =
            FindingVerificationFindingProjection.ProjectSnapshotFindings(sourceSnapshot);

        IReadOnlyList<ArchitectureFinding> verificationFindings =
            FindingVerificationFindingProjection.ProjectSnapshotFindings(verificationSnapshot);

        return _correlationService.Correlate(sourceFindings, verificationFindings);
    }

    private async Task<IReadOnlyDictionary<string, FindingDisposition>> LoadDispositionsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> findingIds,
        CancellationToken cancellationToken)
    {
        if (findingIds.Count == 0)
        {
            return new Dictionary<string, FindingDisposition>(StringComparer.OrdinalIgnoreCase);
        }

        IReadOnlyList<FindingReviewEventRecord> reviewEvents =
            await _findingReviewTrailRepository.ListForFindingIdsSinceUtcAsync(
                scope.TenantId,
                findingIds,
                DateTimeOffset.MinValue,
                cancellationToken);

        return CrossReviewLatestDispositionMap.Build(reviewEvents);
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
