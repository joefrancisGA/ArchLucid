using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Ingestion;
using ArchLucid.Contracts.Ingestion;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Heuristic context preview (no clone / no LLM) to shorten pilot time-to-first-preview.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class FastPathContextController : ControllerBase
{
    /// <summary>Builds a shallow C4-style preview from an http(s) repository URL.</summary>
    [HttpPost("fast-path/context-preview")]
    [ProducesResponseType(typeof(FastPathContextPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult PostPreview(
        [FromBody] FastPathContextPreviewRequest? request)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            FastPathContextPreviewResponse body = FastPathContextModelBuilder.Build(request.RepositoryUrl);
            return Ok(body);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
