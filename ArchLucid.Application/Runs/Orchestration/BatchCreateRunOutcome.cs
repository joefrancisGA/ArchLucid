namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Batch-level result of <see cref="IArchitectureRunBatchCreateOrchestrator.CreateBatchAsync" />.</summary>
public enum BatchCreateRunOutcome
{
    /// <summary>The batch was processed; per-item outcomes describe individual successes and failures.</summary>
    Accepted = 0,

    /// <summary>The supplied <c>Idempotency-Key</c> already recorded a completed batch, so nothing was re-created.</summary>
    IdempotentReplay = 1,

    /// <summary>The supplied <c>Idempotency-Key</c> was previously used with a different batch payload.</summary>
    IdempotencyKeyPayloadMismatch = 2
}
