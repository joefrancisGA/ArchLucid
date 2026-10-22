using ArchLucid.Contracts.Governance;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

public static partial class ProblemDetailsExtensions
{
    /// <summary>Returns 409 when optional pre-commit governance blocks commit.</summary>
    public static IActionResult GovernancePreCommitBlockedProblem(
        this ControllerBase controller,
        PreCommitGateResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.GovernancePreCommitBlocked,
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = result.Reason ?? "Commit blocked by governance policy.",
            Instance = controller.Request.Path,
            Extensions = { ["blockingFindingIds"] = result.BlockingFindingIds.ToArray() }
        };

        if (result.PolicyPackId is not null)

            problem.Extensions["policyPackId"] = result.PolicyPackId;

        if (result.MinimumBlockingSeverity is int minimumBlockingSeverity)
            problem.Extensions["minimumBlockingSeverity"] = minimumBlockingSeverity;

        if (!string.IsNullOrWhiteSpace(result.BlockExplanation))
            problem.Extensions["blockExplanation"] = result.BlockExplanation;

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }
}
