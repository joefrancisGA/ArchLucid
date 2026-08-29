using System.Diagnostics;

using ArchLucid.Core.OperationalErrors;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Core.OperationalErrors;

/// <summary>Shared helpers for building operational error capture requests from HTTP context.</summary>
public static class OperationalErrorHttpCapture
{
    public const string CaptureHandledItemKey = "ArchLucid.OperationalError.CaptureHandled";

    public static void TryCaptureFromException(
        IOperationalErrorCaptureService captureService,
        HttpContext httpContext,
        Exception exception,
        int statusCode,
        string? problemType,
        string source,
        string category)
    {
        ArgumentNullException.ThrowIfNull(captureService);
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(exception);

        httpContext.Items[CaptureHandledItemKey] = true;

        captureService.TryCapture(BuildRequest(httpContext, exception, statusCode, problemType, source, category));
    }

    public static void TryCaptureFromResult(
        IOperationalErrorCaptureService captureService,
        HttpContext httpContext,
        int statusCode,
        string? problemType,
        string? messageOverride,
        string source)
    {
        ArgumentNullException.ThrowIfNull(captureService);
        ArgumentNullException.ThrowIfNull(httpContext);

        if (httpContext.Items.ContainsKey(CaptureHandledItemKey))
            return;

        captureService.TryCapture(
            BuildRequest(
                httpContext,
                exception: null,
                statusCode,
                problemType,
                source,
                OperationalErrorCategory.HttpError,
                messageOverride));
    }

    private static OperationalErrorCaptureRequest BuildRequest(
        HttpContext httpContext,
        Exception? exception,
        int statusCode,
        string? problemType,
        string source,
        string category,
        string? messageOverride = null)
    {
        IScopeContextProvider? scopeProvider =
            httpContext.RequestServices.GetService<IScopeContextProvider>();

        ScopeContext scope = scopeProvider?.GetCurrentScope() ?? new ScopeContext();

        string? actorUserId = httpContext.User?.Identity?.IsAuthenticated == true
            ? httpContext.User.Identity?.Name
            : null;

        return new OperationalErrorCaptureRequest
        {
            Source = source,
            Category = category,
            HttpStatusCode = statusCode,
            HttpMethod = httpContext.Request.Method,
            RequestPath = httpContext.Request.Path.Value,
            ProblemType = problemType,
            Exception = exception,
            MessageOverride = messageOverride,
            CorrelationId = httpContext.TraceIdentifier,
            OtelTraceId = Activity.Current?.TraceId.ToString(),
            TenantId = NullIfEmpty(scope.TenantId),
            WorkspaceId = NullIfEmpty(scope.WorkspaceId),
            ProjectId = NullIfEmpty(scope.ProjectId),
            ActorUserId = actorUserId
        };
    }

    public static string? ExtractProblemType(object? resultValue)
    {
        if (resultValue is Microsoft.AspNetCore.Mvc.ProblemDetails problemDetails)
            return problemDetails.Type;

        return null;
    }

    private static Guid? NullIfEmpty(Guid value) => value == Guid.Empty ? null : value;
}
