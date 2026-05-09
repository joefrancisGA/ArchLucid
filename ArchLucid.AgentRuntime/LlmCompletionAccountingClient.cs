using System.Diagnostics;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Scoped decorator: enforces per-tenant token quota, records OTel counters (and optional per-tenant series),
///     and forwards to the inner client (typically <see cref="AzureOpenAiCompletionClient" />).
/// </summary>
public sealed class LlmCompletionAccountingClient : IAgentCompletionClient
{
    private readonly IAuditService _auditService;

    private readonly IOptionsMonitor<LlmDailyTenantTokenWindowOptions> _dailyTenantBudgetOptions;

    private readonly LlmDailyTenantBudgetTracker _dailyTenantBudgetTracker;

    private readonly IAgentCompletionClient _inner;

    private readonly IOptionsMonitor<LlmTelemetryLabelOptions> _labelOptions;

    private readonly ILogger<LlmCompletionAccountingClient> _logger;

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _monthlyDollarBudgetOptions;

    private readonly LlmMonthlyTenantDollarBudgetTracker _monthlyDollarBudgetTracker;

    private readonly IPromptRedactor _promptRedactor;

    private readonly IOptionsMonitor<LlmTokenQuotaOptions> _quotaOptions;

    private readonly LlmTokenQuotaWindowTracker _quotaTracker;

    private readonly IOptionsMonitor<LlmPromptRedactionOptions> _redactionOptions;

    private readonly IScopeContextProvider _scopeProvider;

    private readonly IOptionsMonitor<LlmTelemetryOptions> _telemetryOptions;

    private readonly IUsageMeteringService _usageMetering;

    public LlmCompletionAccountingClient(
        IAgentCompletionClient inner,
        LlmTokenQuotaWindowTracker quotaTracker,
        IScopeContextProvider scopeProvider,
        IOptionsMonitor<LlmTokenQuotaOptions> quotaOptions,
        IOptionsMonitor<LlmTelemetryOptions> telemetryOptions,
        IOptionsMonitor<LlmTelemetryLabelOptions> labelOptions,
        IOptionsMonitor<LlmPromptRedactionOptions> redactionOptions,
        IPromptRedactor promptRedactor,
        IUsageMeteringService usageMetering,
        IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyTenantBudgetOptions,
        LlmDailyTenantBudgetTracker dailyTenantBudgetTracker,
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarBudgetOptions,
        LlmMonthlyTenantDollarBudgetTracker monthlyDollarBudgetTracker,
        IAuditService auditService,
        ILogger<LlmCompletionAccountingClient> logger)
    {
        ArgumentNullException.ThrowIfNull(inner);
        ArgumentNullException.ThrowIfNull(quotaTracker);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(quotaOptions);
        ArgumentNullException.ThrowIfNull(telemetryOptions);
        ArgumentNullException.ThrowIfNull(labelOptions);
        ArgumentNullException.ThrowIfNull(redactionOptions);
        ArgumentNullException.ThrowIfNull(promptRedactor);
        ArgumentNullException.ThrowIfNull(usageMetering);
        ArgumentNullException.ThrowIfNull(dailyTenantBudgetOptions);
        ArgumentNullException.ThrowIfNull(dailyTenantBudgetTracker);
        ArgumentNullException.ThrowIfNull(monthlyDollarBudgetOptions);
        ArgumentNullException.ThrowIfNull(monthlyDollarBudgetTracker);
        ArgumentNullException.ThrowIfNull(auditService);
        ArgumentNullException.ThrowIfNull(logger);

        _inner = inner;
        _quotaTracker = quotaTracker;
        _scopeProvider = scopeProvider;
        _quotaOptions = quotaOptions;
        _telemetryOptions = telemetryOptions;
        _labelOptions = labelOptions;
        _redactionOptions = redactionOptions;
        _promptRedactor = promptRedactor;
        _usageMetering = usageMetering;
        _dailyTenantBudgetOptions = dailyTenantBudgetOptions;
        _dailyTenantBudgetTracker = dailyTenantBudgetTracker;
        _monthlyDollarBudgetOptions = monthlyDollarBudgetOptions;
        _monthlyDollarBudgetTracker = monthlyDollarBudgetTracker;
        _auditService = auditService;
        _logger = logger;
    }

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string providerKind = _inner.Descriptor.ProviderKind;

        try
        {
            if (_dailyTenantBudgetOptions.CurrentValue.Enabled)
                await _dailyTenantBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_monthlyDollarBudgetOptions.CurrentValue.Enabled)
                await _monthlyDollarBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_quotaOptions.CurrentValue.Enabled)
                _quotaTracker.EnsureWithinQuotaBeforeCall(scope.TenantId);
        }
        catch (LlmTokenQuotaExceededException)
        {
            ArchLucidInstrumentation.LlmQuotaExceededTotal.Add(1);
            throw;
        }

        LlmPromptRedactionOptions redactionOpts = _redactionOptions.CurrentValue;
        string outboundSystem = systemPrompt;
        string outboundUser = userPrompt;

        if (!redactionOpts.Enabled)
        {
            ArchLucidInstrumentation.RecordLlmPromptRedactionSkipped();
        }
        else
        {
            PromptRedactionOutcome systemOutcome = _promptRedactor.Redact(systemPrompt);
            PromptRedactionOutcome userOutcome = _promptRedactor.Redact(userPrompt);

            foreach (KeyValuePair<string, int> kv in systemOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            foreach (KeyValuePair<string, int> kv in userOutcome.CountsByCategory)
                ArchLucidInstrumentation.RecordLlmPromptRedactions(kv.Key, kv.Value);

            outboundSystem = systemOutcome.Text;
            outboundUser = userOutcome.Text;
        }

        try
        {
            return await _inner.CompleteJsonAsync(outboundSystem, outboundUser, cancellationToken);
        }
        finally
        {
            if (AzureOpenAiCompletionClient.TryConsumeLastCompletionTokenUsage(out int promptTok,
                    out int completionTok,
                    out int reasoningTok))
            {
                _ = reasoningTok;

                _quotaTracker.RecordUsage(scope.TenantId, promptTok, completionTok);

                await _dailyTenantBudgetTracker
                    .RecordUsageAndMaybeWarnAsync(
                        scope.TenantId,
                        providerKind,
                        _scopeProvider,
                        _auditService,
                        promptTok,
                        completionTok,
                        CancellationToken.None)
                    .ConfigureAwait(false);

                await _monthlyDollarBudgetTracker
                    .RecordUsageAndMaybeWarnAsync(
                        scope.TenantId,
                        providerKind,
                        _scopeProvider,
                        _auditService,
                        promptTok,
                        completionTok,
                        CancellationToken.None)
                    .ConfigureAwait(false);

                bool perTenant = _telemetryOptions.CurrentValue.RecordPerTenantTokens;
                string? tenantKey = perTenant && scope.TenantId != Guid.Empty ? scope.TenantId.ToString("N") : null;

                LlmTelemetryLabelOptions labels = _labelOptions.CurrentValue;

                ArchLucidInstrumentation.RecordLlmTokenUsage(
                    promptTok,
                    completionTok,
                    perTenant,
                    tenantKey,
                    labels.ProviderId,
                    labels.ModelDeploymentLabel);

                _ = TryRecordLlmUsageMeteringAsync(scope, promptTok, completionTok, cancellationToken);
            }
        }
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
                            CorrelationId = correlationId
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
                            CorrelationId = correlationId
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
