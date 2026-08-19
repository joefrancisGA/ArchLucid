using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.ProblemDetails;

/// <summary>
///     Resolves problem-details audience from <c>x-archlucid-audience</c> (TB-284).
/// </summary>
public static class ProblemDetailsAudienceHttpContext
{
    /// <summary>Request header sent by buyer-polished UI proxy clients.</summary>
    public const string AudienceHeaderName = "x-archlucid-audience";

    private const string BuyerHeaderValue = "buyer";

    /// <inheritdoc cref="TryResolve(HttpContext?)"/>
    public static ProblemDetailsAudience Resolve(HttpContext? httpContext)
    {
        return TryResolve(httpContext, out ProblemDetailsAudience audience) ? audience : ProblemDetailsAudience.Operator;
    }

    /// <summary>
    ///     Returns <see langword="true" /> when the header is present and recognized; otherwise defaults to operator tier.
    /// </summary>
    public static bool TryResolve(HttpContext? httpContext, out ProblemDetailsAudience audience)
    {
        audience = ProblemDetailsAudience.Operator;

        if (httpContext is null)
            return false;

        if (!httpContext.Request.Headers.TryGetValue(AudienceHeaderName, out Microsoft.Extensions.Primitives.StringValues values))
            return false;

        string? raw = values.FirstOrDefault()?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        if (string.Equals(raw, BuyerHeaderValue, StringComparison.OrdinalIgnoreCase))
        {
            audience = ProblemDetailsAudience.Buyer;
            return true;
        }

        return false;
    }
}
