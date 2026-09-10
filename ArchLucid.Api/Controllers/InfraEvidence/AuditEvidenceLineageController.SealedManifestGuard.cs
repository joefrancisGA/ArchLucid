using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class AuditEvidenceLineageController
{
    /// <summary>
    ///     Maps audit evidence lineage <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapAuditEvidenceLineageSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
