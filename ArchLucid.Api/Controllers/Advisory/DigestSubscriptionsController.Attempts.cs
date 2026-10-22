using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Advisory;
using ArchLucid.Decisioning.Advisory.Delivery;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class DigestSubscriptionsController
{
    /// <summary>Recent delivery attempts for a subscription in scope.</summary>
    [HttpGet("{subscriptionId:guid}/attempts")]
    [ProducesResponseType(typeof(IReadOnlyList<DigestDeliveryAttempt>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttempts(
        Guid subscriptionId,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        DigestSubscriptionAttemptsResult result =
            await _digestSubscriptionFacade.ListAttemptsBySubscriptionAsync(subscriptionId, take, ct)
                .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Attempts!),
            DigestSubscriptionHttpOutcome.ResourceNotFound => this.NotFoundProblem(
                $"Digest subscription '{subscriptionId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected attempts outcome: {result.Outcome}."),
        };
    }
}
