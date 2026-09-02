using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.PolicyPacks;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http.Governance;

internal static class PolicyPackHttpResultMapper
{
    internal static IActionResult? ToScopeNotFoundProblemOrNull(
        this ControllerBase controller,
        PolicyPackHttpOutcome outcome) =>
        outcome == PolicyPackHttpOutcome.ScopeNotFound
            ? controller.NotFoundProblem("Tenant or workspace was not found.", ProblemTypes.ResourceNotFound)
            : null;

    internal static IActionResult ToResourceNotFoundProblem(
        this ControllerBase controller,
        string message) =>
        controller.NotFoundProblem(message, ProblemTypes.ResourceNotFound);

    internal static IActionResult ToVersionNotFoundProblem(
        this ControllerBase controller,
        Guid policyPackId,
        string versionKey) =>
        controller.NotFoundProblem(
            $"Policy pack version '{versionKey}' was not found for pack '{policyPackId}'.",
            ProblemTypes.PolicyPackVersionNotFound);

    internal static IActionResult? MapScopeOrNull<T>(this ControllerBase controller, PolicyPackHttpResult<T> result) =>
        controller.ToScopeNotFoundProblemOrNull(result.Outcome);

    internal static IActionResult MapResourceNotFound<T>(
        this ControllerBase controller,
        PolicyPackHttpResult<T> result,
        string defaultMessage) =>
        controller.ToResourceNotFoundProblem(result.Message ?? defaultMessage);

    internal static IActionResult MapAssign(this ControllerBase controller, PolicyPackAssignHttpResult result)
    {
        IActionResult? scopeProblem = controller.ToScopeNotFoundProblemOrNull(result.Outcome);

        if (scopeProblem is not null)
            return scopeProblem;

        return result.Outcome switch
        {
            PolicyPackHttpOutcome.Success => controller.Ok(result.Assignment!),
            PolicyPackHttpOutcome.ResourceNotFound => controller.ToResourceNotFoundProblem(
                $"Policy pack '{result.PolicyPackId}' was not found in the current scope."),
            PolicyPackHttpOutcome.VersionNotFound => controller.ToVersionNotFoundProblem(
                result.PolicyPackId!.Value,
                result.VersionKey!),
            _ => throw new InvalidOperationException($"Unexpected assign outcome: {result.Outcome}."),
        };
    }

    internal static IActionResult MapVersionLookup(this ControllerBase controller, PolicyPackVersionHttpResult result)
    {
        return result.Outcome switch
        {
            PolicyPackVersionLookupOutcome.Found => controller.Ok(result.Version!),
            PolicyPackVersionLookupOutcome.PackNotFound => controller.ToResourceNotFoundProblem(
                $"Policy pack '{result.PolicyPackId}' was not found in the current scope."),
            PolicyPackVersionLookupOutcome.VersionNotFound => controller.ToVersionNotFoundProblem(
                result.PolicyPackId!.Value,
                result.PackVersion!),
            _ => throw new InvalidOperationException($"Unexpected version lookup outcome: {result.Outcome}."),
        };
    }
}
