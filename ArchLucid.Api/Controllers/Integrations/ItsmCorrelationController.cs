using ArchLucid.Api.Models.Integrations;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Operator-registered ITSM ticket ↔ finding correlation for inbound webhooks.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/correlations")]
[EnableRateLimiting("fixed")]
public sealed class ItsmCorrelationController(
    IScopeContextProvider scope,
    IItsmFindingCorrelationRepository correlations) : ControllerBase
{
    private readonly IScopeContextProvider _scope = scope ?? throw new ArgumentNullException(nameof(scope));

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterCorrelation(
        [FromBody] RegisterItsmCorrelationRequest body,
        CancellationToken ct)
    {
        if (body is null)

            return BadRequest("body is required.");

        if (string.IsNullOrWhiteSpace(body.FindingId))
            return BadRequest("findingId is required.");

        if (string.IsNullOrWhiteSpace(body.Provider))
            return BadRequest("provider is required.");

        if (string.IsNullOrWhiteSpace(body.ExternalKey))
            return BadRequest("externalKey is required.");

        string provider = body.Provider.Trim();

        if (!provider.Equals("Jira", StringComparison.OrdinalIgnoreCase) &&
            !provider.Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))

            return BadRequest("provider must be Jira or ServiceNow.");

        provider = provider.Equals("Jira", StringComparison.OrdinalIgnoreCase) ? "Jira" : "ServiceNow";

        ScopeContext ctx = _scope.GetCurrentScope();

        await _correlations.RegisterAsync(
                ctx.TenantId,
                ctx.WorkspaceId,
                ctx.ProjectId,
                body.FindingId,
                provider,
                body.ExternalKey,
                body.ExternalSysId,
                ct)
            .ConfigureAwait(false);

        return NoContent();
    }
}
