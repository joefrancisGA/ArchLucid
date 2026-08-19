using ArchLucid.Api.Demo;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Operator one-click demo review (<c>POST /v1/reviews/demo</c>).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/reviews")]
[EnableRateLimiting("expensive")]
public sealed class ReviewsDemoController(OperatorDemoReviewService operatorDemoReviewService) : ControllerBase
{
    private readonly OperatorDemoReviewService _operatorDemoReviewService =
        operatorDemoReviewService ?? throw new ArgumentNullException(nameof(operatorDemoReviewService));

    /// <summary>
    ///     Creates a committed review package from a built-in flawed architecture brief under default policy packs —
    ///     no manual intake or policy configuration required.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("demo")]
    [MutatingAuditExcluded("OperatorDemoReviewService writes RunSubmitted and RunCompleted audit events during the pipeline.")]
    [ProducesResponseType(typeof(OperatorDemoReviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RunDemoReviewAsync(CancellationToken cancellationToken)
    {
        try
        {
            OperatorDemoReviewResponse body =
                await _operatorDemoReviewService.RunAsync(cancellationToken).ConfigureAwait(false);

            return Ok(body);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
