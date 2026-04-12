namespace ArchLucid.Host.Core.Middleware;

/// <summary>
/// Adds baseline security headers for API responses (defense in depth; does not replace WAF or browser CSP for SPAs).
/// Production hosts also enable <c>UseHsts()</c> in the pipeline (see <c>PipelineExtensions</c>) for HTTPS clients.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    /// <summary>Content-Security-Policy for JSON API responses (single source of truth for middleware and tests).</summary>
    public const string ContentSecurityPolicyApiJson =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

    public Task InvokeAsync(HttpContext context)
    {
        HttpResponse response = context.Response;
        response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
        response.Headers.TryAdd("X-Frame-Options", "DENY");
        response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        // API JSON responses: deny active content; tighten further at the edge (Front Door / WAF) for SPAs.
        response.Headers.TryAdd("Content-Security-Policy", ContentSecurityPolicyApiJson);
        // Passive-scan hygiene (ZAP 10015): API responses are not browser cache assets.
        response.Headers.TryAdd("Cache-Control", "no-store, max-age=0");
        response.Headers.TryAdd("Pragma", "no-cache");
        // ZAP 10063 Feature-Policy / Permissions-Policy: headless JSON API has no device features.
        response.Headers.TryAdd(
            "Permissions-Policy",
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
        // Declares cross-origin embedding/read posture for JSON resources (ZAP 90004 context).
        response.Headers.TryAdd("Cross-Origin-Resource-Policy", "cross-origin");

        return next(context);
    }
}
