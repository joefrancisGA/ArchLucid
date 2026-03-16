using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api.ProblemDetails;

/// <summary>
/// Extension methods for returning RFC 7807 Problem Details from controllers.
/// </summary>
public static class ProblemDetailsExtensions
{
    private const string ProblemJsonMediaType = "application/problem+json";

    /// <summary>
    /// Returns 400 Bad Request with a Problem Details body.
    /// </summary>
    public static IActionResult BadRequestProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null)
    {
        var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Type = type ?? ProblemTypes.BadRequest,
            Title = "Bad Request",
            Status = StatusCodes.Status400BadRequest,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        return new ObjectResult(problem)
        {
            StatusCode = problem.Status,
            ContentTypes = { ProblemJsonMediaType }
        };
    }

    /// <summary>
    /// Returns 404 Not Found with a Problem Details body.
    /// </summary>
    public static IActionResult NotFoundProblem(
        this ControllerBase controller,
        string detail,
        string? type = null,
        string? instance = null)
    {
        var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Type = type ?? ProblemTypes.ResourceNotFound,
            Title = "Not Found",
            Status = StatusCodes.Status404NotFound,
            Detail = detail,
            Instance = instance ?? controller.Request.Path
        };
        return new ObjectResult(problem)
        {
            StatusCode = problem.Status,
            ContentTypes = { ProblemJsonMediaType }
        };
    }
}
