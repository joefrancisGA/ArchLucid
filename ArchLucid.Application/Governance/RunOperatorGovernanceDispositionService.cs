using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

/// <summary>Persists run-level operator governance disposition on <c>dbo.Runs</c> (TB-112).</summary>
public sealed class RunOperatorGovernanceDispositionService(
    IRunRepository runRepository,
    IAuditService auditService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<RunOperatorGovernanceDispositionService> logger) : IRunOperatorGovernanceDispositionService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<RunOperatorGovernanceDispositionService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<RunOperatorGovernanceDispositionDto> RecordAsync(
        Guid runId,
        RecordRunOperatorGovernanceDispositionRequest request,
        ScopeContext scope,
        string actorUserId,
        bool hasCommitBlockingFailures,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(actorUserId))
            throw new ArgumentException("Actor user id is required.", nameof(actorUserId));

        RunOperatorGovernanceDispositionValidation.Validate(request);
        RunOperatorGovernanceDispositionValidation.ValidateApproveAllowed(request.Decision, hasCommitBlockingFailures);

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            throw new KeyNotFoundException($"Run '{runId}' was not found.");

        DateTimeOffset occurredUtc = TimeProvider.System.GetUtcNow();
        string decisionName = request.Decision.ToString();
        string? rationale = string.IsNullOrWhiteSpace(request.Rationale) ? null : request.Rationale.Trim();

        bool updated = await _runRepository.TrySetOperatorGovernanceDispositionAsync(
            scope,
            runId,
            decisionName,
            rationale,
            actorUserId.Trim(),
            occurredUtc.UtcDateTime,
            cancellationToken);

        if (!updated)
            throw new KeyNotFoundException($"Run '{runId}' was not found.");

        AuditEvent auditEvent = new()
        {
            OccurredUtc = occurredUtc.UtcDateTime,
            EventType = AuditEventTypes.RunOperatorGovernanceDispositionRecorded,
            RunId = runId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    runId,
                    decision = decisionName,
                    rationale,
                    actorUserId = actorUserId.Trim(),
                    occurredUtc = occurredUtc.UtcDateTime,
                }),
        };

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"RunOperatorGovernanceDisposition:{runId:N}",
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);

        return new RunOperatorGovernanceDispositionDto
        {
            RunId = runId,
            Decision = request.Decision,
            Rationale = rationale,
            OccurredAtUtc = occurredUtc,
            RecordedByUserId = actorUserId.Trim(),
        };
    }
}
