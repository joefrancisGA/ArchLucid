using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Billing;

public interface ITenantLlmCostReportingService
{
    Task<LlmCostReportingDashboardResponse> BuildDashboardAsync(int days, CancellationToken cancellationToken = default);
}

/// <summary>
///     Tenant-scoped estimated LLM spend dashboard from durable UTC-month budget pressure (Batch B item 18).
///     Values are estimates — not invoiced Azure OpenAI cost.
/// </summary>
public sealed class TenantLlmCostReportingService(
    TimeProvider timeProvider,
    IScopeContextProvider scopeContextProvider,
    ILlmTenantBudgetRepository budgetRepository,
    ITenantRepository tenantRepository,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> budgetOptionsMonitor) : ITenantLlmCostReportingService
{
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _budgetOptionsMonitor =
        budgetOptionsMonitor ?? throw new ArgumentNullException(nameof(budgetOptionsMonitor));

    public async Task<LlmCostReportingDashboardResponse> BuildDashboardAsync(
        int days,
        CancellationToken cancellationToken = default)
    {
        int windowDays = Math.Clamp(days, 1, 90);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        DateTime windowStart = utcNow.Date.AddDays(-(windowDays - 1));

        LlmTenantBudgetStateReadModel monthState = await _budgetRepository
            .GetOrCreateAsync(scope.TenantId, LlmBudgetPeriod.Monthly, FormatUtcMonthKey(utcNow), cancellationToken)
            .ConfigureAwait(false);

        decimal monthPressure = monthState.TotalUsdPressure;
        decimal perDayEstimate = windowDays > 0 ? Math.Round(monthPressure / windowDays, 4) : 0m;

        List<LlmCostDailyBucketResponse> dailyRows = [];

        for (int offset = 0; offset < windowDays; offset += 1)
        {
            DateTime day = windowStart.AddDays(offset);

            dailyRows.Add(new LlmCostDailyBucketResponse
            {
                BucketUtc = new DateTimeOffset(day, TimeSpan.Zero),
                EstimatedCostUsd = perDayEstimate,
                PromptTokens = 0,
                CompletionTokens = 0,
            });
        }

        if (dailyRows.Count > 0 && monthPressure > 0m)
        {
            LlmCostDailyBucketResponse last = dailyRows[^1];
            decimal remainder = monthPressure - (perDayEstimate * (windowDays - 1));

            dailyRows[^1] = new LlmCostDailyBucketResponse
            {
                BucketUtc = last.BucketUtc,
                EstimatedCostUsd = Math.Max(0m, remainder),
                PromptTokens = last.PromptTokens,
                CompletionTokens = last.CompletionTokens,
            };
        }

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        LlmMonthlyTenantDollarBudgetOptions opts = _budgetOptionsMonitor.CurrentValue;
        decimal hardCap = opts.Enabled ? opts.HardCutoffUsdPerUtcMonth + monthState.PurchasedCapBumpUsd : 0m;

        List<LlmCostWorkspaceProjectRowResponse> breakdownRows =
        [
            new()
            {
                WorkspaceId = scope.WorkspaceId,
                WorkspaceName = tenant?.Name ?? scope.TenantId.ToString("D"),
                ProjectId = scope.ProjectId,
                ProjectName = "Current project",
                EstimatedCostUsd = monthPressure,
                PromptTokens = 0,
                CompletionTokens = 0,
            },
        ];

        return new LlmCostReportingDashboardResponse
        {
            Daily = dailyRows,
            ByWorkspaceProject = breakdownRows,
            Currency = "USD",
            CostBasisLabel = hardCap > 0m ? "estimated" : "estimated",
        };
    }

    private static string FormatUtcMonthKey(DateTime utc) =>
        utc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
}
