using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminController
{
    /// <summary>Soft-archives authority runs created strictly before the cutoff (operator-initiated bulk archival).</summary>
    [HttpPost("runs/archive-batch")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(RunArchiveBatchResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ArchiveRunsBatch(
        [FromBody] AdminArchiveRunsBatchRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (body.CreatedBeforeUtc == default)
            return this.BadRequestProblem("CreatedBeforeUtc must be set.", ProblemTypes.ValidationFailed);

        RunArchiveBatchResult result =
            await _diagnostics.ArchiveRunsCreatedBeforeAsync(body.CreatedBeforeUtc, cancellationToken);

        return Ok(result);
    }

    /// <summary>Soft-archives specific runs by id (partial success: per-id failures returned in the body).</summary>
    [HttpPost("runs/archive-by-ids")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(RunArchiveByIdsResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ArchiveRunsByIds(
        [FromBody] AdminArchiveRunsByIdsRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        if (body.RunIds.Count == 0)
            return this.BadRequestProblem("RunIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (body.RunIds.Count > 100)
            return this.BadRequestProblem("At most 100 run ids are allowed per request.",
                ProblemTypes.ValidationFailed);

        RunArchiveByIdsResult result =
            await _diagnostics.ArchiveRunsByIdsAsync(body.RunIds, cancellationToken);

        return Ok(result);
    }

    /// <summary>Clears dead-letter state for one outbox row so the worker will publish again.</summary>
    [HttpPost("integration-outbox/dead-letters/{outboxId:guid}/retry")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RetryIntegrationOutboxDeadLetter(
        Guid outboxId,
        CancellationToken cancellationToken = default)
    {
        bool ok = await _diagnostics.RetryIntegrationOutboxDeadLetterAsync(outboxId, cancellationToken);

        if (!ok)
            return this.NotFoundProblem(
                $"Integration outbox dead-letter row '{outboxId:D}' was not found.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Marks a dead-letter row processed without republishing (operator suppress).</summary>
    [HttpPost("integration-outbox/dead-letters/{outboxId:guid}/suppress")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuppressIntegrationOutboxDeadLetter(
        Guid outboxId,
        [FromBody] IntegrationOutboxDeadLetterSuppressRequest? body,
        CancellationToken cancellationToken = default)
    {
        bool ok = await _diagnostics.SuppressIntegrationOutboxDeadLetterAsync(outboxId, body, cancellationToken);

        if (!ok)
            return this.NotFoundProblem(
                $"Integration outbox dead-letter row '{outboxId:D}' was not found.",
                ProblemTypes.ResourceNotFound);

        return NoContent();
    }

    /// <summary>Builds a cURL replay command for a dead-lettered integration outbox row.</summary>
    [HttpGet("integration-outbox/dead-letters/{outboxId:guid}/curl")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(typeof(IntegrationEventDeadLetterCurlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIntegrationOutboxDeadLetterCurl(
        Guid outboxId,
        CancellationToken cancellationToken = default)
    {
        IntegrationEventDeadLetterCurlResponse? body =
            await _diagnostics.TryBuildIntegrationOutboxDeadLetterCurlAsync(outboxId, cancellationToken);

        if (body is null)
            return this.NotFoundProblem(
                $"Integration outbox dead-letter row '{outboxId:D}' was not found.",
                ProblemTypes.ResourceNotFound);

        return Ok(body);
    }
}
