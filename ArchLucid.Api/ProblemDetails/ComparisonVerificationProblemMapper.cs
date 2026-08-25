using ArchLucid.Application.Analysis;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     Maps <see cref="ComparisonVerificationFailedException" /> to a 422 problem+json body with optional drift
///     extensions.
/// </summary>
internal static class ComparisonVerificationProblemMapper
{
    internal static ObjectResult Map(
        ComparisonVerificationFailedException cvf,
        string? instance,
        HttpContext httpContext)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.ComparisonVerificationFailed,
            Title = "Unprocessable Entity",
            Status = StatusCodes.Status422UnprocessableEntity,
            Detail = cvf.Message,
            Instance = string.IsNullOrWhiteSpace(instance) ? null : instance
        };

        ProblemErrorCodes.AttachErrorCode(problem, ProblemTypes.ComparisonVerificationFailed);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, httpContext);

        if (cvf.Drift is not { } drift)
            return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType } };

        problem.Extensions["driftDetected"] = drift.DriftDetected;

        if (!string.IsNullOrWhiteSpace(drift.Summary))
            problem.Extensions["driftSummary"] = drift.Summary;

        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType } };
    }
}
