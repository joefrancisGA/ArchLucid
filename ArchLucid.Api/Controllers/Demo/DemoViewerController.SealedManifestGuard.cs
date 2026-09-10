using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Demo;

public sealed partial class DemoViewerController
{
    /// <summary>
    ///     Maps demo viewer compare <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapDemoViewerSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
