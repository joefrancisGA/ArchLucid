using ArchLucid.Api.Attributes;
using ArchLucid.Application.Operator;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Operator;

/// <summary>Aggregated operator shell status read-model (trial, migration, LLM budget, alerts inbox, home bundle).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operator/shell-status")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class OperatorShellStatusController(
    IOperatorShellStatusService operatorShellStatusService,
    IAuthorizationService authorizationService) : ControllerBase
{
    private readonly IAuthorizationService _authorizationService =
        authorizationService ?? throw new ArgumentNullException(nameof(authorizationService));

    private readonly IOperatorShellStatusService _operatorShellStatusService =
        operatorShellStatusService ?? throw new ArgumentNullException(nameof(operatorShellStatusService));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(OperatorShellStatusResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetShellStatusAsync(CancellationToken cancellationToken)
    {
        bool includeLlmBudget = (await _authorizationService
                .AuthorizeAsync(User, null, ArchLucidPolicies.ExecuteAuthority)
                .ConfigureAwait(false))
            .Succeeded;

        OperatorShellStatusResult result = await _operatorShellStatusService
            .BuildAsync(includeLlmBudget, includeAlertsInboxSummary: true, cancellationToken)
            .ConfigureAwait(false);

        return Ok(result);
    }
}
