using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>Persists run-level operator governance disposition on <c>dbo.Runs</c> (TB-112).</summary>
public sealed class RunOperatorGovernanceDispositionService(
    IRunRepository runRepository,
    IAuditService auditService) : IRunOperatorGovernanceDispositionService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

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

        await _auditService.LogAsync(
            AuditEventTypes.RunOperatorGovernanceDispositionRecorded,
            new
            {
                runId,
                decision = decisionName,
                rationale,
                actorUserId = actorUserId.Trim(),
                occurredUtc = occurredUtc.UtcDateTime,
            },
            cancellationToken);

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
