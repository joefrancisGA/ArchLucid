using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Demo;

public sealed partial class QuickStartController
{
    /// <summary>
    ///     Maps demo quickstart <see cref="ConflictException" /> raised during sealed-manifest checks to OpenAPI **409**.
    /// </summary>
    private IActionResult MapQuickStartSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
