using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Alerts;

public sealed partial class AlertSimulationController
{
    private static bool IsSealedManifestSimulationBlock(Exception exception) =>
        exception is InvalidOperationException invalidOperationException
        && invalidOperationException.Message.Contains("Alert simulation blocked", StringComparison.Ordinal);

    private IActionResult? MapSealedManifestSimulationBlockOrNull(Exception exception) =>
        IsSealedManifestSimulationBlock(exception)
            ? this.ConflictProblem(exception.Message, ProblemTypes.Conflict)
            : null;
}
