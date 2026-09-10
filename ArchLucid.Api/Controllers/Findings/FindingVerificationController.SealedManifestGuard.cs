using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Findings;

public sealed partial class FindingVerificationController
{
    /// <summary>
    ///     Maps finding verification mutation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapFindingVerificationSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
