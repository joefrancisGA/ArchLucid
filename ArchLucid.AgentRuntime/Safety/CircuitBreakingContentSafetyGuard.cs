using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Safety;

/// <summary>
///     Applies <see cref="CircuitBreakerGate" /> around outbound Azure AI Content Safety so repeated SDK outages open the
///     circuit and a deny-list scrub path can preserve availability without relaxing category thresholds inside Azure.
/// </summary>
public sealed class CircuitBreakingContentSafetyGuard(
    IContentSafetyGuard inner,
    CircuitBreakerGate contentSafetyCircuit,
    IPromptRedactor promptRedactor,
    IOptionsMonitor<ContentSafetyOptions> contentSafetyOptions,
    IServiceScopeFactory serviceScopeFactory,
    ILogger<CircuitBreakingContentSafetyGuard> logger) : IContentSafetyGuard
{
    private static readonly ContentSafetyResult DegradedAllowed = new(true, null, null, null);

    private readonly CircuitBreakerGate _contentSafetyCircuit =
        contentSafetyCircuit ?? throw new ArgumentNullException(nameof(contentSafetyCircuit));

    private readonly IOptionsMonitor<ContentSafetyOptions>
        _contentSafetyOptions = contentSafetyOptions ?? throw new ArgumentNullException(nameof(contentSafetyOptions));

    private readonly IContentSafetyGuard _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly ILogger<CircuitBreakingContentSafetyGuard> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IPromptRedactor _promptRedactor = promptRedactor ?? throw new ArgumentNullException(nameof(promptRedactor));

    private readonly IServiceScopeFactory _serviceScopeFactory =
        serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));

    /// <inheritdoc />
    public Task<ContentSafetyResult> CheckInputAsync(string text, CancellationToken cancellationToken) =>
        GuardAsync(text, "input", _inner.CheckInputAsync, cancellationToken);

    /// <inheritdoc />
    public Task<ContentSafetyResult> CheckOutputAsync(string text, CancellationToken cancellationToken) =>
        GuardAsync(text, "output", _inner.CheckOutputAsync, cancellationToken);

    private static bool IsSdkFailure(ContentSafetyResult result) =>
        !result.IsAllowed && string.Equals(result.Category, "SdkError", StringComparison.Ordinal);

    private async Task<ContentSafetyResult> GuardAsync(
        string text,
        string kind,
        Func<string, CancellationToken, Task<ContentSafetyResult>> invokeInner,
        CancellationToken cancellationToken)
    {
        try
        {
            _contentSafetyCircuit.ThrowIfBroken();
        }
        catch (CircuitBreakerOpenException)
        {
            return await DegradedAllowAsync(text, kind, cancellationToken).ConfigureAwait(false);
        }

        try
        {
            ContentSafetyResult result = await invokeInner(text, cancellationToken).ConfigureAwait(false);

            if (IsSdkFailure(result))
            {
                _contentSafetyCircuit.RecordFailure();

                try
                {
                    _contentSafetyCircuit.ThrowIfBroken();
                }
                catch (CircuitBreakerOpenException)
                {
                    _logger.LogWarning(
                        "Content safety consecutive SDK failures opened circuit breaker; degraded fallback invoked for kind {Kind}.",
                        kind);

                    return await DegradedAllowAsync(text, kind, cancellationToken).ConfigureAwait(false);
                }

                return result;
            }

            _contentSafetyCircuit.RecordSuccess();

            return result;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Content safety inner threw for kind {Kind}; breaker records failure.", kind);
            _contentSafetyCircuit.RecordFailure();

            ContentSafetyOptions options = _contentSafetyOptions.CurrentValue;

            if (!options.FailClosedOnSdkError)
                return new ContentSafetyResult(true, null, null, null);

            try
            {
                _contentSafetyCircuit.ThrowIfBroken();
            }
            catch (CircuitBreakerOpenException)
            {
                return await DegradedAllowAsync(text, kind, cancellationToken).ConfigureAwait(false);
            }

            return new ContentSafetyResult(false, "Content safety service error.", "SdkError", null);
        }
    }

    private async Task<ContentSafetyResult> DegradedAllowAsync(string text, string kind, CancellationToken cancellationToken)
    {
        PromptRedactionOutcome scrubbed = _promptRedactor.RedactAlways(text);

        await TryAuditAsync(kind, scrubbed.CountsByCategory, cancellationToken).ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(
                "Content safety degraded allow path invoked for kind={Kind} with denial-list replacement counts={Count}.",
                kind,
                scrubbed.CountsByCategory.Count);

        return DegradedAllowed;
    }

    private async Task TryAuditAsync(
        string kind,
        IReadOnlyDictionary<string, int> denialCountsByCategory,
        CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceScopeFactory.CreateScope();
            IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

            AuditEvent auditEvent = new()
            {
                EventType = AuditEventTypes.ContentSafetyCircuitDegradedFallback,
                ActorUserId = "content-safety-degraded",
                ActorUserName = "ContentSafetyCircuit",
                ExplicitActor = true,
                TenantId = Guid.Empty,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                DataJson = JsonSerializer.Serialize(new { kind, denialCountsByCategory })
            };

            await auditService.LogAsync(auditEvent, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogDebug(ex, "Content safety degraded audit path failed silently.");
        }
    }
}
