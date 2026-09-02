using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Maps <see cref="GovernanceHttpValidation" /> outcomes to Problem Details responses.</summary>
public static class GovernanceHttpValidationExtensions
{
    public static IActionResult? ToBadRequestProblemOrNull(
        this GovernanceHttpValidation? validation,
        ControllerBase controller)
    {
        if (validation is null)
            return null;

        return controller.BadRequestProblem(validation.Message, validation.ProblemType);
    }
}
