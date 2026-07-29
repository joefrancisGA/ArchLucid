using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Host.Core.ProblemDetails;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Fills empty 4xx/5xx responses (routing failures, default auth challenge/forbid) with problem+json
///     so OpenAPI contract fuzzers see the documented Content-Type and body.
/// </summary>
internal sealed class EmptyErrorResponseNormalizationMiddleware(RequestDelegate next)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        await _next(context);

        if (context.Response.HasStarted)
            return;

        if (context.Response.StatusCode is < 400)
            return;

        if (!string.IsNullOrWhiteSpace(context.Response.ContentType))
            return;

        if (context.Response.ContentLength is > 0)
            return;

        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypeForStatus(context.Response.StatusCode),
            Title = TitleForStatus(context.Response.StatusCode),
            Status = context.Response.StatusCode,
            Detail = DetailForStatus(context.Response.StatusCode),
            Instance = context.Request.Path.Value
        };

        ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, context);

        context.Response.ContentType = ApplicationProblemMapper.ProblemJsonMediaType;
        await context.Response.WriteAsJsonAsync(
            problem,
            SerializerOptions,
            contentType: ApplicationProblemMapper.ProblemJsonMediaType);
    }

    private static string ProblemTypeForStatus(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status401Unauthorized => ProblemTypes.Unauthorized,
            StatusCodes.Status403Forbidden => ProblemTypes.Forbidden,
            StatusCodes.Status404NotFound => ProblemTypes.ResourceNotFound,
            StatusCodes.Status405MethodNotAllowed => ProblemTypes.MethodNotAllowed,
            StatusCodes.Status415UnsupportedMediaType => ProblemTypes.ValidationFailed,
            StatusCodes.Status429TooManyRequests => ProblemTypes.RateLimited,
            StatusCodes.Status503ServiceUnavailable => ProblemTypes.DatabaseUnavailable,
            _ when statusCode >= 500 => ProblemTypes.InternalError,
            _ => ProblemTypes.BadRequest
        };

    private static string TitleForStatus(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status403Forbidden => "Forbidden",
            StatusCodes.Status404NotFound => "Not Found",
            StatusCodes.Status405MethodNotAllowed => "Method Not Allowed",
            StatusCodes.Status415UnsupportedMediaType => "Unsupported Media Type",
            StatusCodes.Status429TooManyRequests => "Too Many Requests",
            StatusCodes.Status503ServiceUnavailable => "Service Unavailable",
            _ when statusCode >= 500 => "An unexpected error occurred.",
            _ => "Error"
        };

    private static string DetailForStatus(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status401Unauthorized => "Authentication is required for this resource.",
            StatusCodes.Status403Forbidden => "You are not allowed to perform this action.",
            StatusCodes.Status404NotFound => "The requested resource was not found.",
            StatusCodes.Status405MethodNotAllowed => "The HTTP method is not allowed for this resource.",
            StatusCodes.Status415UnsupportedMediaType => "The request Content-Type is not supported.",
            StatusCodes.Status429TooManyRequests => "Rate limit exceeded. Retry after the window resets.",
            _ when statusCode >= 500 =>
                "An unhandled exception has occurred. Use the correlationId value in this response when contacting support.",
            _ => "The request could not be completed."
        };
}
