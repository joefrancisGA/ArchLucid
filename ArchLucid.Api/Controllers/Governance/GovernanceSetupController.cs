using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

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
public sealed partial class GovernanceSetupController(
    IScopeContextProvider scopeProvider,
    IPolicyPackResolver resolver,
    IAlertRoutingSubscriptionRepository subscriptionRepository,
    ITenantRepository tenantRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IRunDetailQueryService runDetailQueryService) : ControllerBase
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IPolicyPackResolver _resolver =
        resolver ?? throw new ArgumentNullException(nameof(resolver));

    private readonly IAlertRoutingSubscriptionRepository _subscriptionRepository =
        subscriptionRepository ?? throw new ArgumentNullException(nameof(subscriptionRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <summary>Setup guide bundle: effective policy packs and alert routing subscriptions.</summary>
    [HttpGet("setup-guide-bundle")]
    [ProducesResponseType(typeof(GovernanceSetupGuideBundleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetSetupGuideBundle(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IActionResult? scopeProblem = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            scope,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        IActionResult? sealedGuardResult =
            await EnsureGovernanceScopeSealedManifestReadAllowedAsync(scope, cancellationToken);

        if (sealedGuardResult is not null)
            return sealedGuardResult;

        Task<EffectivePolicyPackSet> effectiveTask = _resolver.ResolveAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        Task<IReadOnlyList<AlertRoutingSubscription>> routingTask =
            _subscriptionRepository.ListEnabledByScopeAsync(
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
