using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.OperationalErrors;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Filters;

/// <summary>
///     Persists HTTP error responses that did not originate from the exception filter (controller-returned 4xx/5xx).
/// </summary>
public sealed class OperationalErrorResultFilter(
    IOperationalErrorCaptureService captureService,
    IOptionsMonitor<OperationalErrorOptions> options) : IAlwaysRunResultFilter
{
    private readonly IOperationalErrorCaptureService _captureService =
        captureService ?? throw new ArgumentNullException(nameof(captureService));

    private readonly IOptionsMonitor<OperationalErrorOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public void OnResultExecuting(ResultExecutingContext context)
    {
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
        if (context.Exception is not null && !context.ExceptionHandled)
            return;

        OperationalErrorOptions opts = _options.CurrentValue;

        if (!opts.Enabled)
            return;

        int? statusCode = ResolveStatusCode(context.Result);

        if (statusCode is null || statusCode < opts.MinHttpStatusCode)
            return;

        string? problemType = ResolveProblemType(context.Result);
        string? messageOverride = ResolveMessage(context.Result);

        OperationalErrorHttpCapture.TryCaptureFromResult(
            _captureService,
            context.HttpContext,
            statusCode.Value,
            problemType,
            messageOverride,
            OperationalErrorSource.Api);
    }

    private static int? ResolveStatusCode(IActionResult? result)
    {
        return result switch
        {
            ObjectResult objectResult => objectResult.StatusCode,
            StatusCodeResult statusCodeResult => statusCodeResult.StatusCode,
            _ => null
        };
    }

    private static string? ResolveProblemType(IActionResult? result)
    {
        if (result is ObjectResult objectResult)
            return OperationalErrorHttpCapture.ExtractProblemType(objectResult.Value);

        return null;
    }

    private static string? ResolveMessage(IActionResult? result)
    {
        if (result is ObjectResult { Value: Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails })
            return problemDetails.Title ?? problemDetails.Detail;

        return null;
    }
}
