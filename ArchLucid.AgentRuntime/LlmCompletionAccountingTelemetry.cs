using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     OTel token counters, per-tenant labels, cost-delta logging, and usage metering for
///     <see cref="LlmCompletionAccountingClient" />.
/// </summary>
public sealed class LlmCompletionAccountingTelemetry
{
    private readonly IOptionsMonitor<LlmTelemetryOptions> _telemetryOptions;

    private readonly IOptionsMonitor<LlmTelemetryLabelOptions> _labelOptions;

    private readonly IUsageMeteringService _usageMetering;

    private readonly ILlmCostEstimator _costEstimator;

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _monthlyDollarBudgetOptions;

    private readonly ILogger<LlmCompletionAccountingTelemetry> _logger;

    public LlmCompletionAccountingTelemetry(
        IOptionsMonitor<LlmTelemetryOptions> telemetryOptions,
        IOptionsMonitor<LlmTelemetryLabelOptions> labelOptions,
        IUsageMeteringService usageMetering,
        ILlmCostEstimator costEstimator,
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarBudgetOptions,
        ILogger<LlmCompletionAccountingTelemetry> logger)
    {
        ArgumentNullException.ThrowIfNull(telemetryOptions);
        ArgumentNullException.ThrowIfNull(labelOptions);
        ArgumentNullException.ThrowIfNull(usageMetering);
        ArgumentNullException.ThrowIfNull(costEstimator);
        ArgumentNullException.ThrowIfNull(monthlyDollarBudgetOptions);
        ArgumentNullException.ThrowIfNull(logger);

        _telemetryOptions = telemetryOptions;
        _labelOptions = labelOptions;
        _usageMetering = usageMetering;
        _costEstimator = costEstimator;
        _monthlyDollarBudgetOptions = monthlyDollarBudgetOptions;
        _logger = logger;
    }

    public async Task RecordTokenUsageAsync(
        ScopeContext scope,
        int promptTok,
        int completionTok,
        int cachedPromptTok,
        CancellationToken cancellationToken = default)
    {
        bool perTenant = _telemetryOptions.CurrentValue.RecordPerTenantTokens;
        string? tenantKey = perTenant && scope.TenantId != Guid.Empty ? scope.TenantId.ToString("N") : null;

        LlmTelemetryLabelOptions labels = _labelOptions.CurrentValue;
        LlmAccountingInvocationScope? invocationScope = LlmAccountingInvocationScope.GetCurrent();

        ArchLucidInstrumentation.RecordLlmTokenUsage(
            promptTok,
            completionTok,
            perTenant,
            tenantKey,
            labels.ProviderId,
            labels.ModelDeploymentLabel,
            invocationScope?.ResolveConsumeRoleLabel(),
            invocationScope?.ResolveInvokeKindLabel(),
            cachedPromptTok);

        LlmCompletionCostDeltaLogger.LogIfEnabled(
            _logger,
            _costEstimator,
            _monthlyDollarBudgetOptions,
            promptTok,
            completionTok);

        await TryRecordLlmUsageMeteringAsync(scope, promptTok, completionTok, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task TryRecordLlmUsageMeteringAsync(
        ScopeContext scope,
        int promptTok,
        int completionTok,
        CancellationToken cancellationToken)
    {
        if (scope.TenantId == Guid.Empty)
            return;

        DateTimeOffset recordedUtc = TimeProvider.System.GetUtcNow();
        string? correlationId = Activity.Current?.Id;
        string scopeKey = !string.IsNullOrWhiteSpace(correlationId)
            ? correlationId
            : string.Concat(
                scope.TenantId.ToString("N"),
                ":",
                scope.WorkspaceId.ToString("N"),
                ":",
                scope.ProjectId.ToString("N"),
                ":",
                recordedUtc.ToUnixTimeMilliseconds().ToString(System.Globalization.CultureInfo.InvariantCulture));

        try
        {
            if (promptTok > 0)

                await _usageMetering
                    .RecordAsync(
                        new UsageEvent
                        {
                            TenantId = scope.TenantId,
                            WorkspaceId = scope.WorkspaceId,
                            ProjectId = scope.ProjectId,
                            Kind = UsageMeterKind.LlmPromptTokens,
                            Quantity = promptTok,
                            RecordedUtc = recordedUtc,
                            CorrelationId = correlationId,
                            IdempotencyKey = UsageEventIdempotencyKeys.ForLlmTokens(scopeKey, UsageMeterKind.LlmPromptTokens)
                        },
                        cancellationToken)
                    .ConfigureAwait(false);

            if (completionTok > 0)

                await _usageMetering
                    .RecordAsync(
                        new UsageEvent
                        {
                            TenantId = scope.TenantId,
                            WorkspaceId = scope.WorkspaceId,
                            ProjectId = scope.ProjectId,
                            Kind = UsageMeterKind.LlmCompletionTokens,
                            Quantity = completionTok,
                            RecordedUtc = recordedUtc,
                            CorrelationId = correlationId,
                            IdempotencyKey = UsageEventIdempotencyKeys.ForLlmTokens(scopeKey, UsageMeterKind.LlmCompletionTokens)
                        },
                        cancellationToken)
                    .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(
                    ex,
                    "Usage metering failed for tenant {TenantId} (LLM tokens).",
                    scope.TenantId);
        }
    }
}
