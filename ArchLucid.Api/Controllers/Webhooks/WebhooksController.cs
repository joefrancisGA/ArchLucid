using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Webhooks;

/// <summary>
///     Outbound webhook subscription operations (connectivity test). Canonical route for assessment and OpenAPI:
///     <c>POST /v1/webhooks/subscriptions/{id}/test</c>.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/webhooks/subscriptions")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class WebhooksController(IWebhookSubscriptionTestService subscriptionTestService) : ControllerBase
{
    private readonly IWebhookSubscriptionTestService _subscriptionTestService =
        subscriptionTestService ?? throw new ArgumentNullException(nameof(subscriptionTestService));

    /// <summary>
    ///     Dispatches a synthetic signed ping to the subscription destination and returns the remote HTTP response.
    /// </summary>
    [HttpPost("{subscriptionId:guid}/test")]
    [MutatingAuditExcluded("Audit: IWebhookSubscriptionTestService logs AlertRoutingWebhookPingExecuted.")]
    [ProducesResponseType(typeof(OutboundWebhookDryRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TestSubscriptionAsync(
        Guid subscriptionId,
        CancellationToken cancellationToken = default)
    {
        WebhookSubscriptionTestResult result =
            await _subscriptionTestService.TestAsync(subscriptionId, cancellationToken);

        return ToActionResult(result);
    }

    private IActionResult ToActionResult(WebhookSubscriptionTestResult result)
    {
        if (result.IsSuccess && result.Response is not null)
        {
            return Ok(result.Response);
        }

        if (result.ErrorStatusCode == StatusCodes.Status404NotFound)
        {
            return this.NotFoundProblem(result.ErrorDetail ?? "Not found.", result.ErrorProblemType);
        }

        return this.BadRequestProblem(result.ErrorDetail ?? "Bad request.", result.ErrorProblemType);
    }
}
