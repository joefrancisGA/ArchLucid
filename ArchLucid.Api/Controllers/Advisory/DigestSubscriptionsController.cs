using ArchLucid.Api.Attributes;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     Manages <see cref="DigestSubscription" /> routes for architecture digests (email/webhook delivery after advisory
///     scans).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/digest-subscriptions")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class DigestSubscriptionsController(IDigestSubscriptionFacade digestSubscriptionFacade) : ControllerBase
{
    private readonly IDigestSubscriptionFacade _digestSubscriptionFacade =
        digestSubscriptionFacade ?? throw new ArgumentNullException(nameof(digestSubscriptionFacade));
}
