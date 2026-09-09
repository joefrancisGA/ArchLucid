using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.InfraEvidence.RemediationInstances;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class RemediationInstancesController
{
    /// <summary>
    ///     Remediation mutations fail-closed via <see cref="RemediationInstanceSealedManifestHashGuard" /> in the service layer.
    /// </summary>
    private static bool IsSealedManifestConflict(string? message) =>
        message?.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase) == true
        || message?.Contains("sealed manifest", StringComparison.OrdinalIgnoreCase) == true
        || message?.Contains("lifecycle must be Complete", StringComparison.OrdinalIgnoreCase) == true;

    private IActionResult MapRemediationSealedManifestConflict(string? message) =>
        this.ConflictProblem(
            message ?? "Remediation blocked: sealed manifest verification failed.",
            ProblemTypes.Conflict);
}
