using ArchLucid.Api.ProblemDetails;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Rewrites <c>application/json</c> Content-Type on error responses to <c>application/problem+json</c>
///     so runtime matches the OpenAPI error media types (ASP.NET <c>WriteAsJsonAsync</c> / formatters often emit JSON).
/// </summary>
internal sealed class ProblemJsonContentTypeMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        context.Response.OnStarting(static state =>
        {
            HttpContext httpContext = (HttpContext)state!;

            if (httpContext.Response.StatusCode is < 400)
                return Task.CompletedTask;

            string? contentType = httpContext.Response.ContentType;

            if (string.IsNullOrWhiteSpace(contentType))
                return Task.CompletedTask;

            if (contentType.Contains("problem+json", StringComparison.OrdinalIgnoreCase))
                return Task.CompletedTask;

            if (!contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) &&
                !contentType.StartsWith("text/json", StringComparison.OrdinalIgnoreCase))
                return Task.CompletedTask;

            httpContext.Response.ContentType = ApplicationProblemMapper.ProblemJsonMediaType;

            return Task.CompletedTask;
        }, context);

        await _next(context);
    }
}
