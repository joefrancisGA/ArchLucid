using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Connectors.Publishing;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin-only Confluence publishing (first-value report Markdown → new Cloud page).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/integrations/confluence")]
public sealed class ConfluencePublishingAdminController(IConfluenceFirstValueReportPublisher publisher) : ControllerBase
{
    private readonly IConfluenceFirstValueReportPublisher _publisher =
        publisher ?? throw new ArgumentNullException(nameof(publisher));

    /// <summary>Creates a new Confluence page from the canonical first-value Markdown for <paramref name="body"/>.RunId.</summary>
    [HttpPost("first-value-report")]
    [ProducesResponseType(typeof(ConfluenceFirstValueReportPublishResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> PublishFirstValueReportAsync(
        [FromBody] ConfluenceFirstValueReportPublishRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.RunId))

            return this.BadRequestProblem(
                "RunId is required.",
                ProblemTypes.ValidationFailed);

        string baseForLinks = string.IsNullOrWhiteSpace(body.ApiBaseForLinks)
            ? $"{Request.Scheme}://{Request.Host.Value}"
            : body.ApiBaseForLinks.Trim();

        PublishOutcome outcome = await _publisher
            .PublishFirstValueReportAsync(body.RunId.Trim(), baseForLinks, cancellationToken)
            .ConfigureAwait(false);

        if (outcome is { Succeeded: true, ExternalPageId: not null })

            return Ok(new ConfluenceFirstValueReportPublishResponse(outcome.ExternalPageId, null));

        if (outcome.FailureReason is ConfluencePublishFailureReason.NotFound)

            return this.NotFoundProblem(outcome.ErrorMessage ?? "Run not found.", ProblemTypes.ResourceNotFound);

        int status = outcome.FailureReason switch
        {
            ConfluencePublishFailureReason.Unauthorized or ConfluencePublishFailureReason.Forbidden
                or ConfluencePublishFailureReason.RateLimited or ConfluencePublishFailureReason.ServerError
                or ConfluencePublishFailureReason.NetworkError => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status400BadRequest
        };

        if (status is StatusCodes.Status503ServiceUnavailable)

            return this.ServiceUnavailableProblem(
                outcome.ErrorMessage ?? "Confluence publish failed.",
                ProblemTypes.UpstreamIntegrationFailed);

        return this.BadRequestProblem(outcome.ErrorMessage ?? "Confluence publish failed.", ProblemTypes.ValidationFailed);
    }
}
