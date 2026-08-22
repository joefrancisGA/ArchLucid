using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Documents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Advisory text extraction for evidence PDF/DOCX before a review run is created.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/evidence")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class EvidenceDocumentTextExtractionController(
    IDocumentTextExtractionService documentTextExtractionService) : ControllerBase
{
    /// <summary>
    ///     Extracts plain text from a single PDF or DOCX upload for intake clarification prefill. Does not persist
    ///     evidence.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("extract-text")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [MutatingAuditExcluded("Advisory text extraction only; no durable evidence or run mutation.")]
    [RequestSizeLimit(DocumentTextExtractionLimits.MaxUploadBytes)]
    public async Task<IActionResult> ExtractTextAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        DocumentTextExtractionResult result =
            await documentTextExtractionService.ExtractAsync(file, cancellationToken);

        if (!result.Succeeded)
        {
            string detail = result.FailureDetail ?? "Text extraction failed.";

            if (detail.Contains("exceeds maximum size", StringComparison.OrdinalIgnoreCase))
            {
                return this.BadRequestProblem(detail);
            }

            if (detail.Contains("No file was uploaded", StringComparison.OrdinalIgnoreCase)
                || detail.Contains("must include a name", StringComparison.OrdinalIgnoreCase)
                || detail.Contains("Only PDF and DOCX", StringComparison.OrdinalIgnoreCase)
                || detail.Contains("empty", StringComparison.OrdinalIgnoreCase))
            {
                return this.BadRequestProblem(detail);
            }

            return this.UnprocessableEntityProblem(detail);
        }

        return Ok(new
        {
            fileName = result.FileName,
            contentType = result.ContentType,
            text = result.Text,
            characterCount = result.CharacterCount,
            truncated = result.Truncated,
        });
    }
}
