using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence.Mermaid;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class InfraEvidenceInventoryController
{
    /// <summary>
    ///     Maps inventory drift surfaces blocked by <see cref="InfraEvidenceSnapshotSealedManifestHashGuard" /> to OpenAPI **409**.
    /// </summary>
    private IActionResult MapInventorySealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
