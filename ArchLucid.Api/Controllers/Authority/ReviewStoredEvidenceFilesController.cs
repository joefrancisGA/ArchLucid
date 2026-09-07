using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Evidence;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Lists stored evidence files uploaded for a review run (ESI-01 catalog).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/review/{runId:guid}/evidence")]
public sealed class ReviewStoredEvidenceFilesController(
    IRunStoredEvidenceFileCatalogService catalogService) : ControllerBase
{
    /// <summary>Returns metadata for evidence files stored for this review run.</summary>
    [HttpGet("files")]
    [ProducesResponseType(typeof(IReadOnlyList<RunStoredEvidenceFileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListStoredEvidenceFilesAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<RunStoredEvidenceFileDto>? files =
            await catalogService.ListForRunAsync(runId, cancellationToken);

        if (files is null)
        {
            return NotFound();
        }

        return Ok(files);
    }
}
