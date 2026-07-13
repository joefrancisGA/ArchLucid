using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ArchLucid.Api.Filters;

/// <summary>
///     Replaces bare status-code results with problem+json bodies so contract fuzzers see documented Content-Type values.
/// </summary>
public sealed class ApiErrorResponseNormalizationFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult objectResult &&
            objectResult.StatusCode is >= 400 &&
            objectResult.ContentTypes.Count == 0)
        {
            objectResult.ContentTypes.Add(ApplicationProblemMapper.ProblemJsonMediaType);
            return;
        }

        if (context.Result is not StatusCodeResult statusCodeResult || statusCodeResult.StatusCode is < 400)
            return;

        context.Result = CreateProblemResult(context, statusCodeResult.StatusCode);
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }

    private static ObjectResult CreateProblemResult(ResultExecutingContext context, int statusCode)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Status = statusCode,
            Title = StatusCodeTitle(statusCode),
            Instance = context.HttpContext.Request.Path.Value
        };

        return new ObjectResult(problem)
        {
            StatusCode = statusCode,
            ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType }
        };
    }

    private static string StatusCodeTitle(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status403Forbidden => "Forbidden",
            StatusCodes.Status404NotFound => "Not Found",
            StatusCodes.Status409Conflict => "Conflict",
            StatusCodes.Status503ServiceUnavailable => "Service Unavailable",
            _ => "Error"
        };
}
