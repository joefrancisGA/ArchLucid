using System.Diagnostics;
using System.Runtime.CompilerServices;

using ArchLucid.Core.Audit;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
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
public sealed class LlmCompletionAccountingClient : IAgentStreamingCompletionClient
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

    private readonly ILlmCostEstimator _costEstimator;

    private readonly IAiBudgetPreCallGuard _aiBudgetPreCallGuard;

    private readonly IDemoAiPromptCache _demoPromptCache;

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageControlsOptions;

    private readonly bool _useJudgeDailyCapOnly;

    private readonly IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>? _judgeDailyBudgetOptions;

    private readonly LlmJudgeDailyTokenBudgetTracker? _judgeDailyBudgetTracker;

    private readonly IAgentLogicalStepSpendCapPolicy? _spendCapPolicy;

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
        ILlmCostEstimator costEstimator,
        IAiBudgetPreCallGuard aiBudgetPreCallGuard,
        IDemoAiPromptCache demoPromptCache,
        IOptionsMonitor<AiUsageControlsOptions> aiUsageControlsOptions,
        IAuditService auditService,
        ILogger<LlmCompletionAccountingClient> logger,
        bool useJudgeDailyCapOnly = false,
        IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>? judgeDailyBudgetOptions = null,
        LlmJudgeDailyTokenBudgetTracker? judgeDailyBudgetTracker = null,
        IAgentLogicalStepSpendCapPolicy? spendCapPolicy = null)
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
        ArgumentNullException.ThrowIfNull(costEstimator);
        ArgumentNullException.ThrowIfNull(aiBudgetPreCallGuard);
        ArgumentNullException.ThrowIfNull(demoPromptCache);
        ArgumentNullException.ThrowIfNull(aiUsageControlsOptions);
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
        _costEstimator = costEstimator;
        _aiBudgetPreCallGuard = aiBudgetPreCallGuard;
        _demoPromptCache = demoPromptCache;
        _aiUsageControlsOptions = aiUsageControlsOptions;
        _auditService = auditService;
        _logger = logger;
        _useJudgeDailyCapOnly = useJudgeDailyCapOnly;

        if (useJudgeDailyCapOnly)
        {
            ArgumentNullException.ThrowIfNull(judgeDailyBudgetOptions);
            ArgumentNullException.ThrowIfNull(judgeDailyBudgetTracker);
        }

        _judgeDailyBudgetOptions = judgeDailyBudgetOptions;
        _judgeDailyBudgetTracker = judgeDailyBudgetTracker;
        _spendCapPolicy = spendCapPolicy;
    }

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string providerKind = _inner.Descriptor.ProviderKind;

        AiBudgetPreCallGuardResult guardResult = await _aiBudgetPreCallGuard
            .EnsureAllowedAsync(
                scope.TenantId,
                AmbientAiUsageFeatureScope.Current,
                providerKind,
                systemPrompt,
                userPrompt,
                correlationId: null,
                actorUserId: null,
                cancellationToken)
            .ConfigureAwait(false);

        if (guardResult.ServedFromDemoCache && !string.IsNullOrWhiteSpace(guardResult.CachedResponseJson))
        {
            return guardResult.CachedResponseJson;
        }

        _spendCapPolicy?.EnsureBilledAttemptAllowed();

        long? dailyReserved = null;
        decimal? monthlyReserved = null;
        bool overageActive = false;

        try
        {
            if (_useJudgeDailyCapOnly)
            {
                if (_judgeDailyBudgetOptions!.CurrentValue.Enabled)
                    dailyReserved = await _judgeDailyBudgetTracker!
                        .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                        .ConfigureAwait(false);
            }
            else if (_dailyTenantBudgetOptions.CurrentValue.Enabled)
                dailyReserved = await _dailyTenantBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_monthlyDollarBudgetOptions.CurrentValue.Enabled)
                (monthlyReserved, overageActive) = await _monthlyDollarBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_quotaOptions.CurrentValue.Enabled)
                _quotaTracker.EnsureWithinQuotaBeforeCall(scope.TenantId);
        }
        catch (LlmTokenQuotaExceededException)
        {
            if (_useJudgeDailyCapOnly)
                _judgeDailyBudgetTracker!.RecordBudgetExhausted();
            else
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
            string completion =
                await _inner.CompleteJsonAsync(outboundSystem, outboundUser, maxTokens, temperature, cancellationToken);

            if (_aiUsageControlsOptions.CurrentValue.DemoMode)
            {
                _demoPromptCache.Set(
                    DemoAiPromptCacheKeys.Build(systemPrompt, userPrompt),
                    completion);
            }

            return completion;
        }
        finally
        {
            // Peek (do not consume): schema remediation trace recording and CostGuardrailInterceptor
            // read the same ambient usage after this decorator returns.
            bool usageAvailable = AzureOpenAiCompletionClient.TryPeekLastCompletionTokenUsage(out int promptTok,
                out int completionTok,
                out int reasoningTok,
                out int cachedPromptTok);

            if (!usageAvailable)
            {
                if (_useJudgeDailyCapOnly)
                {
                    await _judgeDailyBudgetTracker!
                        .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                        .ConfigureAwait(false);
                }
                else
                {
                    await _dailyTenantBudgetTracker
                        .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                        .ConfigureAwait(false);
                }

                await _monthlyDollarBudgetTracker
                    .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, monthlyReserved, overageActive, CancellationToken.None)
                    .ConfigureAwait(false);
            }
            else
            {
                _ = reasoningTok;

                _quotaTracker.RecordUsage(scope.TenantId, promptTok, completionTok);

                if (_useJudgeDailyCapOnly)
                {
                    await _judgeDailyBudgetTracker!
                        .RecordUsageAsync(
                            scope.TenantId,
                            providerKind,
                            promptTok,
                            completionTok,
                            dailyReserved,
                            CancellationToken.None)
                        .ConfigureAwait(false);
                }
                else
                {
                    await _dailyTenantBudgetTracker
                        .RecordUsageAndMaybeWarnAsync(
                            scope.TenantId,
                            providerKind,
                            _scopeProvider,
                            _auditService,
                            promptTok,
                            completionTok,
                            dailyReserved,
                            CancellationToken.None)
                        .ConfigureAwait(false);
                }

                await _monthlyDollarBudgetTracker
                    .RecordUsageAndMaybeWarnAsync(
                        scope.TenantId,
                        providerKind,
                        _scopeProvider,
                        _auditService,
                        promptTok,
                        completionTok,
                        monthlyReserved,
                        overageActive,
                        CancellationToken.None)
                    .ConfigureAwait(false);

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

                await TryRecordLlmUsageMeteringAsync(scope, promptTok, completionTok, CancellationToken.None)
                    .ConfigureAwait(false);

                decimal? estimatedUsd = _costEstimator.EstimateUsd(promptTok, completionTok);

                await _aiBudgetPreCallGuard
                    .RecordCompletionAsync(
                        scope.TenantId,
                        AmbientAiUsageFeatureScope.Current,
                        providerKind,
                        promptTok,
                        completionTok,
                        estimatedUsd,
                        correlationId: null,
                        actorUserId: null,
                        CancellationToken.None)
                    .ConfigureAwait(false);
            }
        }
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string providerKind = _inner.Descriptor.ProviderKind;

        long? dailyReserved = null;
        decimal? monthlyReserved = null;
        bool overageActive = false;

        try
        {
            if (_dailyTenantBudgetOptions.CurrentValue.Enabled)
                dailyReserved = await _dailyTenantBudgetTracker
                    .EnsureWithinBudgetBeforeCallAsync(scope.TenantId, providerKind, cancellationToken)
                    .ConfigureAwait(false);

            if (_monthlyDollarBudgetOptions.CurrentValue.Enabled)
                (monthlyReserved, overageActive) = await _monthlyDollarBudgetTracker
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

        // Non-streaming inners: call CompleteJsonAsync on this async method (not a nested
        // IAsyncEnumerable). AsyncLocal token seeds from the inner client are otherwise lost
        // across AgentCompletionStreamingBridge yields and never reach metering/quota settle.

        if (_inner is not IAgentStreamingCompletionClient)
        {
            string full;

            try
            {
                full = await _inner
                    .CompleteJsonAsync(outboundSystem, outboundUser, maxTokens, temperature, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch
            {
                await SettleStreamUsageAccountingAsync(
                        scope,
                        providerKind,
                        dailyReserved,
                        monthlyReserved,
                        overageActive)
                    .ConfigureAwait(false);

                throw;
            }

            await SettleStreamUsageAccountingAsync(
                    scope,
                    providerKind,
                    dailyReserved,
                    monthlyReserved,
                    overageActive)
                .ConfigureAwait(false);

            foreach (string chunk in AgentCompletionStreamingBridge.SimulateChunks(full))
            {
                yield return chunk;
            }

            yield break;
        }

        try
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               _inner,
                               outboundSystem,
                               outboundUser,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                yield return chunk;
            }
        }
        finally
        {
            await SettleStreamUsageAccountingAsync(
                    scope,
                    providerKind,
                    dailyReserved,
                    monthlyReserved,
                    overageActive)
                .ConfigureAwait(false);
        }
    }

    private async Task SettleStreamUsageAccountingAsync(
        ScopeContext scope,
        string providerKind,
        long? dailyReserved,
        decimal? monthlyReserved,
        bool overageActive)
    {
        // Peek (do not consume): schema remediation trace recording and CostGuardrailInterceptor
        // read the same ambient usage after this decorator returns.
        bool usageAvailable = AzureOpenAiCompletionClient.TryPeekLastCompletionTokenUsage(
            out int promptTok,
            out int completionTok,
            out int reasoningTok,
            out int cachedPromptTok);

        if (!usageAvailable)
        {
            await _dailyTenantBudgetTracker
                .ReleasePendingReservationIfAnyAsync(scope.TenantId, providerKind, dailyReserved, CancellationToken.None)
                .ConfigureAwait(false);

            await _monthlyDollarBudgetTracker
                .ReleasePendingReservationIfAnyAsync(
                    scope.TenantId,
                    providerKind,
                    monthlyReserved,
                    overageActive,
                    CancellationToken.None)
                .ConfigureAwait(false);

            return;
        }

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
                dailyReserved,
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
                monthlyReserved,
                overageActive,
                CancellationToken.None)
            .ConfigureAwait(false);

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

        await TryRecordLlmUsageMeteringAsync(scope, promptTok, completionTok, CancellationToken.None)
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
