using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class OperationsController
{
    /// <summary>
    ///     Maps async operation cancel <see cref="ConflictException" /> raised during sealed-manifest checks to OpenAPI **409**.
    /// </summary>
    private IActionResult MapOperationsSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    /// <summary>
    ///     Maps reference-evidence admin ZIP export <see cref="ConflictException" /> to OpenAPI **409**.
    /// </summary>
    internal static IActionResult MapReferenceEvidenceAdminSealedManifestConflict(
        ControllerBase controller,
        ConflictException ex) =>
        controller.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
