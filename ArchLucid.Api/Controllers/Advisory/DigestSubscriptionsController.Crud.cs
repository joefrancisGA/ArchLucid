using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Advisory.Scheduling;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class DigestSubscriptionsController
{
    /// <summary>Creates a subscription stamped with the current scope; mutating action requires execute authority.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IDigestSubscriptionFacade.CreateAsync logs DigestSubscriptionCreated.")]
    [ProducesResponseType(typeof(DigestSubscription), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] DigestSubscription? subscription,
        CancellationToken ct = default)
    {
        if (subscription is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        DigestSubscriptionCreateResult result = await _digestSubscriptionFacade.CreateAsync(subscription, ct)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Subscription!),
            DigestSubscriptionHttpOutcome.ValidationFailed => this.BadRequestProblem(
                result.Message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unexpected create outcome: {result.Outcome}."),
        };
    }

    /// <summary>Lists digest subscriptions for the caller's tenant/workspace/project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DigestSubscription>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DigestSubscription>>> List(CancellationToken ct = default)
    {
        IReadOnlyList<DigestSubscription> result = await _digestSubscriptionFacade.ListByScopeAsync(ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Toggles <see cref="DigestSubscription.IsEnabled" /> when the row is in scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{subscriptionId:guid}/toggle")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IDigestSubscriptionFacade.ToggleAsync logs DigestSubscriptionToggled.")]
    [ProducesResponseType(typeof(DigestSubscription), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle(Guid subscriptionId, CancellationToken ct = default)
    {
        DigestSubscriptionToggleResult result = await _digestSubscriptionFacade.ToggleAsync(subscriptionId, ct)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Subscription!),
            DigestSubscriptionHttpOutcome.ResourceNotFound => this.NotFoundProblem(
                $"Digest subscription '{subscriptionId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected toggle outcome: {result.Outcome}."),
        };
    }
}
