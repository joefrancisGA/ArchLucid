using ArchLucid.Application.Templates;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Catalog of operator-selectable architecture request templates (wizard presets).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class TemplatesController : ControllerBase
{
    /// <summary>Returns template ids, titles, and short descriptions for the New Run wizard.</summary>
    [HttpGet("templates")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureRequestTemplateSummary>), StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<ArchitectureRequestTemplateSummary>> GetTemplates()
    {
        return Ok(ArchitectureRequestTemplates.Summaries);
    }
}
