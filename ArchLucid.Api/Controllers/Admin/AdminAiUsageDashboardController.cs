using ArchLucid.Application.AiUsage;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin AI usage dashboard for trial/demo budget governance.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed class AdminAiUsageDashboardController(
    ITenantAiBudgetPolicyResolver policyResolver,
    IAiUsageEventRepository usageEventRepository,
    IScopeContextProvider scopeContextProvider,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpGet("ai-usage-dashboard")]
    [ProducesResponseType(typeof(AdminAiUsageDashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminAiUsageDashboardResponse>> GetAsync(CancellationToken cancellationToken = default)
    {
        Guid tenantId = scopeContextProvider.GetCurrentScope().TenantId;
        TenantAiBudgetPolicySnapshot policy =
            await policyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        DateTimeOffset fromUtc = timeProvider.GetUtcNow().AddDays(-30);
        IReadOnlyDictionary<AiUsageFeature, decimal> byFeature =
            await usageEventRepository.SumEstimatedCostByFeatureAsync(tenantId, fromUtc, cancellationToken)
                .ConfigureAwait(false);

        IReadOnlyList<AiUsageEventRecord> recent =
            await usageEventRepository.ListRecentForTenantAsync(tenantId, 25, cancellationToken).ConfigureAwait(false);

        return Ok(
            new AdminAiUsageDashboardResponse
            {
                BudgetAmountUsd = policy.BudgetAmountUsd,
                UsedAmountUsd = policy.UsedAmountUsd,
                RemainingAmountUsd = policy.RemainingAmountUsd,
                ResetPeriod = policy.ResetPeriod,
                HardStopEnabled = policy.HardStopEnabled,
                TrialExpirationUtc = policy.TrialExpirationUtc,
                WorkspaceKind = policy.WorkspaceKind.ToString(),
                CustomerAiProviderConfigured = policy.CustomerAiProviderConfigured,
                UsageByFeatureUsd = byFeature.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value),
                RecentEvents = recent
                    .Select(e => new AdminAiUsageEventRow
                    {
                        OccurredUtc = e.OccurredUtc,
                        Feature = e.Feature.ToString(),
                        ProviderKind = e.ProviderKind,
                        EstimatedCostUsd = e.EstimatedCostUsd,
                        UserId = e.UserId,
                        ServedFromDemoCache = e.ServedFromDemoCache,
                        BudgetBlocked = e.BudgetBlocked,
                    })
                    .ToList(),
            });
    }
}

public sealed class AdminAiUsageDashboardResponse
{
    public decimal BudgetAmountUsd { get; init; }

    public decimal UsedAmountUsd { get; init; }

    public decimal RemainingAmountUsd { get; init; }

    public string ResetPeriod { get; init; } = string.Empty;

    public bool HardStopEnabled { get; init; }

    public DateTimeOffset? TrialExpirationUtc { get; init; }

    public string WorkspaceKind { get; init; } = string.Empty;

    public bool CustomerAiProviderConfigured { get; init; }

    public Dictionary<string, decimal> UsageByFeatureUsd { get; init; } = new();

    public IReadOnlyList<AdminAiUsageEventRow> RecentEvents { get; init; } = Array.Empty<AdminAiUsageEventRow>();
}

public sealed class AdminAiUsageEventRow
{
    public DateTimeOffset OccurredUtc { get; init; }

    public string Feature { get; init; } = string.Empty;

    public string ProviderKind { get; init; } = string.Empty;

    public decimal EstimatedCostUsd { get; init; }

    public string? UserId { get; init; }

    public bool ServedFromDemoCache { get; init; }

    public bool BudgetBlocked { get; init; }
}
