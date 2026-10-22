using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     Single mapping path from application exceptions to <see cref="ObjectResult" /> problem+json responses.
///     Used by <see cref="ApiProblemDetailsExceptionFilter" /> and
///     <see cref="ProblemDetailsExtensions.InvalidOperationProblem" />.
/// </summary>
public static class ApplicationProblemMapper
{
    public const string ProblemJsonMediaType = "application/problem+json";

    /// <summary>
    ///     Maps exceptions handled globally by the API (filter). Returns false if not mapped.
    /// </summary>
    public static bool TryMapUnhandledException(Exception ex, HttpContext httpContext, out ObjectResult? result)
        => ApplicationUnhandledExceptionMapper.TryMapUnhandledException(ex, httpContext, out result);

    /// <summary>
    ///     Maps <see cref="InvalidOperationException" /> to a 400 Bad Request response.
    ///     "Not found" scenarios must use typed exceptions (<see cref="RunNotFoundException" />,
    ///     <see cref="ConflictException" />, etc.) so they are handled by
    ///     <see cref="TryMapUnhandledException" /> before reaching this method.
    /// </summary>
    /// <param name="badRequestProblemType"></param>
    /// <param name="httpContext">Current request; used to stamp <see cref="ProblemCorrelation.ExtensionKey" />.</param>
    /// <param name="ex"></param>
    /// <param name="instance"></param>
    public static ObjectResult MapInvalidOperation(
        InvalidOperationException ex,
        string? instance,
        string badRequestProblemType,
        HttpContext? httpContext)
    {
        return CreateProblemResult(
            StatusCodes.Status400BadRequest,
            "Bad Request",
            ex.Message,
            badRequestProblemType,
            instance,
            httpContext);
    }

    /// <summary>
    ///     Maps SQL Server timeouts (<see cref="SqlException" /> with <c>Number == -2</c>),
    ///     deadlock victims (<c>1205</c>) to <see cref="StatusCodes.Status409Conflict" />,
    ///     syntax/programming faults to <see cref="StatusCodes.Status500InternalServerError" />,
    ///     <see cref="TimeoutException" /> to 503, and other <see cref="DbException" /> to 503 Service Unavailable.
    /// </summary>
    /// <remarks>
    ///     <see cref="SqlException.Number" /> <c>-2</c> is the canonical SQL Server timeout error code.
    ///     Deadlock (<c>1205</c>) from parallel writers is treated like other commit races so clients receive 409, not 503.
    ///     Syntax and programming faults (for example <c>319</c> missing <c>;</c> before a CTE, or <c>8120</c>
    ///     select-list / <c>GROUP BY</c> mismatch) map to HTTP 500 so deterministic query bugs are not masked as
    ///     retryable outages.
    ///     Remaining database-origin exceptions are surfaced as retryable 503 so clients and load balancers
    ///     can distinguish transient failures from permanent 500 errors.
    /// </remarks>
    public static bool TryMapDatabaseException(
        Exception ex,
        string? instance,
        HttpContext httpContext,
        out ObjectResult? result)
        => ApplicationDatabaseExceptionMapper.TryMapDatabaseException(ex, instance, httpContext, out result);

    public static ObjectResult CreateProblemResult(
        int statusCode,
        string title,
        string detail,
        string type,
        string? instance,
        HttpContext? httpContext,
        Action<Microsoft.AspNetCore.Mvc.ProblemDetails>? extend = null)
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = type,
            Title = title,
            Status = statusCode,
            Detail = detail,
            Instance = string.IsNullOrWhiteSpace(instance) ? null : instance
        };

        ProblemErrorCodes.AttachErrorCode(problem, type);
        extend?.Invoke(problem);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, httpContext);

        return new ObjectResult(problem) { StatusCode = statusCode, ContentTypes = { ProblemJsonMediaType } };
    }
}
