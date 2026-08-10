using ArchLucid.Application.Http;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http;

/// <summary>Controller helpers for conditional GET negotiation on operator read endpoints.</summary>
public static class ConditionalGetControllerExtensions
{
    /// <summary>Applies validator headers and returns <c>304 Not Modified</c> when <c>If-None-Match</c> matches.</summary>
    public static IActionResult? TryConditionalNotModified(this ControllerBase controller, string etag)
    {
        if (string.IsNullOrEmpty(etag))
            return null;

        if (!ConditionalGetNegotiation.TryMatchIfNoneMatch(controller.Request.Headers.IfNoneMatch, etag))
            return null;

        ApplyValidatorHeaders(controller.Response, etag);
        return controller.StatusCode(StatusCodes.Status304NotModified);
    }

    /// <summary>Returns <c>200 OK</c> with validator headers, or <c>304</c> when the client tag is current.</summary>
    public static IActionResult OkWithConditionalEtag<T>(this ControllerBase controller, T value, string etag)
    {
        IActionResult? notModified = controller.TryConditionalNotModified(etag);

        if (notModified is not null)
            return notModified;

        if (!string.IsNullOrEmpty(etag))
            ApplyValidatorHeaders(controller.Response, etag);

        return controller.Ok(value);
    }

    private static void ApplyValidatorHeaders(HttpResponse response, string etag)
    {
        response.Headers.ETag = etag;
        response.Headers.CacheControl = ConditionalGetNegotiation.PrivateNoStoreCacheControl;
    }
}
