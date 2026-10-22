using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence.Mermaid;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class InfraEvidenceDiffsController
{
    /// <summary>
    ///     Maps drift-workbench <see cref="ConflictException" /> raised via
    ///     <see cref="InfraEvidenceSnapshotSealedManifestHashGuard" /> to OpenAPI **409** responses.
    /// </summary>
    private IActionResult MapDiffSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
