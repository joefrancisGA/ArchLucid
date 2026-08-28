using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

public static partial class ProblemDetailsExtensions
{
    /// <summary>
    ///     Returns 500 Internal Server Error with a Problem Details body. Use only for genuine server-side faults
    ///     where the caller cannot recover by changing the request — transient downstream failures should prefer
    ///     <see cref="ServiceUnavailableProblem(ControllerBase, string, string?, string?)" /> so clients retry.
    /// </summary>
    public static IActionResult InternalServerErrorProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.InternalError,
            Title = "Internal Server Error",
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>
    ///     Returns 503 Service Unavailable with a Problem Details body (e.g. database timeout, transient downstream failure).
    /// </summary>
    public static IActionResult ServiceUnavailableProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type ?? ProblemTypes.DatabaseUnavailable,
            Title = "Service Unavailable",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        ApplyOptionalProblemExtensions(problem, extensions);
        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);
        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>Returns 503 with an explicit <c>extensions.errorCode</c> (TB-896 Quick Scan concurrency).</summary>
    public static IActionResult ServiceUnavailableProblemWithErrorCode(
        this ControllerBase controller,
        string detail,
        string errorCode,
        string? instance = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.DatabaseUnavailable,
            Title = "Service Unavailable",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = detail,
            Instance = instance ?? controller.Request.Path,
        };
        problem.Extensions["errorCode"] = errorCode;
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);

        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>Returns 429 with an explicit <c>extensions.errorCode</c> (TB-897 Quick Scan identity/abuse).</summary>
    public static IActionResult TooManyRequestsProblemWithErrorCode(
        this ControllerBase controller,
        string detail,
        string errorCode,
        string? instance = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.LlmTokenQuotaExceeded,
            Title = "Too many requests",
            Status = StatusCodes.Status429TooManyRequests,
            Detail = detail,
            Instance = instance ?? controller.Request.Path,
        };
        problem.Extensions["errorCode"] = errorCode;
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);

        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }

    /// <summary>Returns 403 with an explicit <c>extensions.errorCode</c> (TB-897 Quick Scan friction).</summary>
    public static IActionResult ForbiddenProblemWithErrorCode(
        this ControllerBase controller,
        string title,
        string detail,
        string errorCode,
        string? instance = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.BusinessRuleViolation,
            Title = title,
            Status = StatusCodes.Status403Forbidden,
            Detail = detail,
            Instance = instance ?? controller.Request.Path,
        };
        problem.Extensions["errorCode"] = errorCode;
        AttachAudienceSupportHint(problem, controller.HttpContext);
        ProblemCorrelation.Attach(problem, controller.HttpContext);

        return new ObjectResult(problem) { StatusCode = problem.Status, ContentTypes = { ProblemJsonMediaType } };
    }
}
