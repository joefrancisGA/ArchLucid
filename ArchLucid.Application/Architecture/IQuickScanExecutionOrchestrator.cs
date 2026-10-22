using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>Shared Quick Scan POST pipeline for marketing (anonymous) and architecture (authenticated) routes.</summary>
public interface IQuickScanExecutionOrchestrator
{
    Task<QuickScanExecutionResult> ExecuteAsync(
        ArchitectureQuickScanRequest? request,
        QuickScanExecutionRequestContext context,
        CancellationToken cancellationToken = default);
}

/// <summary>HTTP-derived context for guard, budget, and audit wiring.</summary>
public sealed class QuickScanExecutionRequestContext
{
    public required string ClientIp { get; init; }

    public required string SessionId { get; init; }

    public required string TraceIdentifier { get; init; }

    public string? ClientRequestedModelId { get; init; }

    public required Guid TenantId { get; init; }

    public required Guid WorkspaceId { get; init; }

    public required Guid ProjectId { get; init; }

    public required string AuditActor { get; init; }

    /// <summary>When true, distributed concurrency + queue admission runs before budget reservation (TB-896).</summary>
    public bool RequiresAnonymousDistributedConcurrency { get; init; }

    /// <summary>Signed browser cookie/header id for layered identity limits (TB-897).</summary>
    public string? BrowserId { get; init; }

    /// <summary>Optional Turnstile (or equivalent) token when progressive CAPTCHA friction is enabled.</summary>
    public string? BotChallengeToken { get; init; }
}
