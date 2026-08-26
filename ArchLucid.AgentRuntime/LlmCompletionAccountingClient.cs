using System.Runtime.CompilerServices;

using ArchLucid.Core.Audit;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Scoped decorator: enforces per-tenant token quota, records OTel counters (and optional per-tenant series),
///     and forwards to the inner client (typically <see cref="AzureOpenAiCompletionClient" />).
/// </summary>
public sealed partial class LlmCompletionAccountingClient : IAgentStreamingCompletionClient
{
    private readonly IAuditService _auditService;

    private readonly IOptionsMonitor<LlmDailyTenantTokenWindowOptions> _dailyTenantBudgetOptions;

    private readonly LlmDailyTenantBudgetTracker _dailyTenantBudgetTracker;

    private readonly IAgentCompletionClient _inner;

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _monthlyDollarBudgetOptions;

    private readonly LlmMonthlyTenantDollarBudgetTracker _monthlyDollarBudgetTracker;

    private readonly IPromptRedactor _promptRedactor;

    private readonly IOptionsMonitor<LlmTokenQuotaOptions> _quotaOptions;

    private readonly LlmTokenQuotaWindowTracker _quotaTracker;

    private readonly IOptionsMonitor<LlmPromptRedactionOptions> _redactionOptions;

    private readonly IScopeContextProvider _scopeProvider;

    private readonly LlmCompletionAccountingTelemetry _telemetry;

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
        LlmCompletionAccountingTelemetry telemetry,
        IOptionsMonitor<LlmPromptRedactionOptions> redactionOptions,
        IPromptRedactor promptRedactor,
        IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyTenantBudgetOptions,
        LlmDailyTenantBudgetTracker dailyTenantBudgetTracker,
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarBudgetOptions,
        LlmMonthlyTenantDollarBudgetTracker monthlyDollarBudgetTracker,
        ILlmCostEstimator costEstimator,
        IAiBudgetPreCallGuard aiBudgetPreCallGuard,
        IDemoAiPromptCache demoPromptCache,
        IOptionsMonitor<AiUsageControlsOptions> aiUsageControlsOptions,
        IAuditService auditService,
        bool useJudgeDailyCapOnly = false,
        IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>? judgeDailyBudgetOptions = null,
        LlmJudgeDailyTokenBudgetTracker? judgeDailyBudgetTracker = null,
        IAgentLogicalStepSpendCapPolicy? spendCapPolicy = null)
    {
        ArgumentNullException.ThrowIfNull(inner);
        ArgumentNullException.ThrowIfNull(quotaTracker);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(quotaOptions);
        ArgumentNullException.ThrowIfNull(telemetry);
        ArgumentNullException.ThrowIfNull(redactionOptions);
        ArgumentNullException.ThrowIfNull(promptRedactor);
        ArgumentNullException.ThrowIfNull(dailyTenantBudgetOptions);
        ArgumentNullException.ThrowIfNull(dailyTenantBudgetTracker);
        ArgumentNullException.ThrowIfNull(monthlyDollarBudgetOptions);
        ArgumentNullException.ThrowIfNull(monthlyDollarBudgetTracker);
        ArgumentNullException.ThrowIfNull(costEstimator);
        ArgumentNullException.ThrowIfNull(aiBudgetPreCallGuard);
        ArgumentNullException.ThrowIfNull(demoPromptCache);
        ArgumentNullException.ThrowIfNull(aiUsageControlsOptions);
        ArgumentNullException.ThrowIfNull(auditService);

        _inner = inner;
        _quotaTracker = quotaTracker;
        _scopeProvider = scopeProvider;
        _quotaOptions = quotaOptions;
        _telemetry = telemetry;
        _redactionOptions = redactionOptions;
        _promptRedactor = promptRedactor;
        _dailyTenantBudgetOptions = dailyTenantBudgetOptions;
        _dailyTenantBudgetTracker = dailyTenantBudgetTracker;
        _monthlyDollarBudgetOptions = monthlyDollarBudgetOptions;
        _monthlyDollarBudgetTracker = monthlyDollarBudgetTracker;
        _costEstimator = costEstimator;
        _aiBudgetPreCallGuard = aiBudgetPreCallGuard;
        _demoPromptCache = demoPromptCache;
        _aiUsageControlsOptions = aiUsageControlsOptions;
        _auditService = auditService;
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
}
