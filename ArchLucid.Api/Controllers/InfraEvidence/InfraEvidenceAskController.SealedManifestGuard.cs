using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class InfraEvidenceAskController
{
    /// <summary>
    ///     Maps infra-evidence Ask <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapAskSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
