using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/prompt-variants")]
public sealed class PromptVariantsAdminController(IPromptVariantStatsService statsService) : ControllerBase
{
    private readonly IPromptVariantStatsService _statsService =
        statsService ?? throw new ArgumentNullException(nameof(statsService));

    [HttpGet("stats")]
    [ProducesResponseType(typeof(PromptVariantStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStatsAsync(
        [FromQuery] string templateName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(templateName))
            return this.BadRequestProblem("templateName is required.", ProblemTypes.ValidationFailed);

        PromptVariantStatsResponse response =
            await _statsService.GetStatsAsync(templateName, cancellationToken);

        return Ok(response);
    }
}
