using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     Maps common application exceptions to RFC 9457 Problem Details responses (obsoletes RFC 7807).
///     Keeps controllers focused on HTTP mapping by centralizing exception handling.
/// </summary>
public sealed class ApiProblemDetailsExceptionFilter(ILogger<ApiProblemDetailsExceptionFilter> logger)
    : IExceptionFilter
{
    private readonly ILogger<ApiProblemDetailsExceptionFilter> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public void OnException(ExceptionContext context)
    {
        if (context.ExceptionHandled)
            return;

        if (!ApplicationProblemMapper.TryMapUnhandledException(context.Exception, context.HttpContext,
                out ObjectResult? result))
            return;

        if (result?.StatusCode is >= StatusCodes.Status500InternalServerError)
            LogMappedServerError(context, result);

        context.Result = result;
        context.ExceptionHandled = true;
    }

    private void LogMappedServerError(ExceptionContext context, ObjectResult result)
    {
        if (!_logger.IsEnabled(LogLevel.Error))
            return;

        string? problemType = ExtractProblemType(result.Value);

        _logger.LogErrorMappedProblemDetailsException(
            context.Exception,
            context.HttpContext.Request.Method,
            context.HttpContext.Request.Path.Value,
            result.StatusCode ?? StatusCodes.Status500InternalServerError,
            problemType,
            TryGetSqlErrorNumber(context.Exception),
            context.HttpContext.TraceIdentifier);
    }

    private static string? ExtractProblemType(object? resultValue)
    {
        if (resultValue is Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails)
            return problemDetails.Type;

        return null;
    }

    private static int? TryGetSqlErrorNumber(Exception ex)
    {
        for (Exception? current = ex; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException)
                return sqlException.Number;
        }

        return null;
    }
}
