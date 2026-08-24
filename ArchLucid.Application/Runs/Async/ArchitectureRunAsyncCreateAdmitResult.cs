namespace ArchLucid.Application.Runs.Async;

/// <summary>Outcome of fast async create admit (request + run stub + idempotency committed).</summary>
public sealed record ArchitectureRunAsyncCreateAdmitResult(
    Guid RunId,
    bool IdempotentReplay);
