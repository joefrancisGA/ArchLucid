using System.Text;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Billing;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Billing;

/// <summary>Azure Marketplace SaaS fulfillment webhooks (JWT verified inside <see cref="AzureMarketplaceBillingProvider"/>).</summary>
[ApiController]
[AllowAnonymous]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/billing/webhooks")]
public sealed class BillingMarketplaceWebhookController(AzureMarketplaceBillingProvider marketplaceBillingProvider)
    : ControllerBase
{
    private readonly AzureMarketplaceBillingProvider _marketplaceBillingProvider =
        marketplaceBillingProvider ?? throw new ArgumentNullException(nameof(marketplaceBillingProvider));

    [HttpPost("marketplace")]
    [Consumes("application/json")]
    public async Task<IActionResult> MarketplaceAsync(CancellationToken cancellationToken)
    {
        Request.EnableBuffering();

        string rawBody;

        using (StreamReader reader = new(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: true))
        {
            rawBody = await reader.ReadToEndAsync(cancellationToken);
        }

        string? auth = Request.Headers.Authorization.ToString();

        string? bearer = null;

        if (!string.IsNullOrWhiteSpace(auth) &&
            auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            bearer = auth["Bearer ".Length..].Trim();
        }

        BillingWebhookInbound inbound = new()
        {
            RawBody = rawBody,
            MarketplaceAuthorizationBearer = bearer,
        };

        BillingWebhookHandleResult result =
            await _marketplaceBillingProvider.HandleWebhookAsync(inbound, cancellationToken);

        if (result.DuplicateIgnored || result.Succeeded)
        {
            return Ok();
        }

        return this.BadRequestProblem(result.ErrorDetail ?? "Marketplace webhook rejected.", ProblemTypes.BadRequest);
    }
}
