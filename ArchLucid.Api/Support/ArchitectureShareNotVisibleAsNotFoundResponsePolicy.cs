using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Support;

/// <summary>
///     AS-095 / ADR 0087: restricted architectures and linked runs return 404 (not 403) so
///     unshared workspace members cannot infer existence from status codes.
/// </summary>
public static class ArchitectureShareNotVisibleAsNotFoundResponsePolicy
{
    public static IActionResult ArchitectureNotFound(ControllerBase controller, Guid architectureId) =>
        controller.NotFoundProblem(
            $"Architecture '{architectureId:D}' was not found.",
            ProblemTypes.ResourceNotFound);

    public static IActionResult RunNotFound(ControllerBase controller, Guid runId) =>
        controller.NotFoundProblem($"Run '{runId:D}' was not found.", ProblemTypes.RunNotFound);
}
