namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Result of one batch architecture-run create request.</summary>
public sealed class BatchCreateRunOrchestrationResult
{
    /// <summary>Batch-level disposition.</summary>
    public BatchCreateRunOutcome Outcome { get; init; } = BatchCreateRunOutcome.Accepted;

    /// <summary>Per-item outcomes in submission order; empty for replay and payload-mismatch outcomes.</summary>
    public IReadOnlyList<BatchCreateRunItemOutcome> Items { get; init; } = [];

    internal static BatchCreateRunOrchestrationResult Replayed() =>
        new() { Outcome = BatchCreateRunOutcome.IdempotentReplay };

    internal static BatchCreateRunOrchestrationResult PayloadMismatch() =>
        new() { Outcome = BatchCreateRunOutcome.IdempotencyKeyPayloadMismatch };

    internal static BatchCreateRunOrchestrationResult Accepted(IReadOnlyList<BatchCreateRunItemOutcome> items) =>
        new() { Outcome = BatchCreateRunOutcome.Accepted, Items = items };
}
