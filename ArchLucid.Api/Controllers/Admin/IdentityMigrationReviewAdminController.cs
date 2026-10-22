using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Administrator visibility into identity migration and duplicate-account review items.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/identity/migration-reviews")]
public sealed class IdentityMigrationReviewAdminController(
    IIdentityMigrationReviewRepository reviewRepository) : ControllerBase
{
    private readonly IIdentityMigrationReviewRepository _reviewRepository =
        reviewRepository ?? throw new ArgumentNullException(nameof(reviewRepository));

    [HttpGet]
    [MutatingAuditExcluded("Read-only migration review queue.")]
    [ProducesResponseType(typeof(IReadOnlyList<IdentityMigrationReviewItemRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListUnresolvedAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<IdentityMigrationReviewItemRecord> rows =
            await _reviewRepository.ListUnresolvedAsync(cancellationToken).ConfigureAwait(false);

        return Ok(rows);
    }
}
