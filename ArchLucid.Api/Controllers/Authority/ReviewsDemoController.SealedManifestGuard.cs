using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ReviewsDemoController
{
    /// <summary>
    ///     Maps operator demo review <see cref="ConflictException" /> raised during sealed-manifest checks to OpenAPI **409**.
    /// </summary>
    private IActionResult MapReviewsDemoSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
