using ArchLucid.Api.Attributes;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Governance.PolicyPacks;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Governance onboarding guide bundles.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class GovernanceSetupController(
    IScopeContextProvider scopeProvider,
    IPolicyPackResolver resolver,
    IAlertRoutingSubscriptionRepository subscriptionRepository) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IPolicyPackResolver _resolver =
        resolver ?? throw new ArgumentNullException(nameof(resolver));

    private readonly IAlertRoutingSubscriptionRepository _subscriptionRepository =
        subscriptionRepository ?? throw new ArgumentNullException(nameof(subscriptionRepository));

    /// <summary>Setup guide bundle: effective policy packs and alert routing subscriptions.</summary>
    [HttpGet("setup-guide-bundle")]
    [ProducesResponseType(typeof(GovernanceSetupGuideBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSetupGuideBundle(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        Task<EffectivePolicyPackSet> effectiveTask = _resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        Task<IReadOnlyList<AlertRoutingSubscription>> routingTask =
            _subscriptionRepository.ListByScopeAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken);

        await Task.WhenAll(effectiveTask, routingTask).ConfigureAwait(false);

        GovernanceSetupGuideBundleResponse body = new()
        {
            EffectivePolicyPacks = await effectiveTask.ConfigureAwait(false),
            AlertRoutingSubscriptions = await routingTask.ConfigureAwait(false),
        };

        return Ok(body);
    }
}
