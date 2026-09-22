using ArchLucid.Core.ProductCapability;

using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Api.Middleware;

/// <summary>Paths and metadata that bypass the OP-04 product-line route gate.</summary>
internal static class ProductLineRouteGatePathClassifier
{
    internal static bool ShouldSkip(
        HttpContext context,
        IProductCapabilityControllerCatalog catalog)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(catalog);

        string path = context.Request.Path.Value ?? string.Empty;

        if (path.Length == 0)
        {
            return true;
        }

        if (path.Contains("/internal/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        foreach (string prefix in catalog.AlwaysAllowedRoutePrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (path is "/" or "/robots.txt" or "/sitemap.xml")
        {
            return true;
        }

        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/scalar", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/version", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/v1/register", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/v1/tenant/erasure", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        Endpoint? endpoint = context.GetEndpoint();

        if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() is not null)
        {
            return true;
        }

        if (context.User.Identity?.IsAuthenticated != true)
        {
            return true;
        }

        return false;
    }
}
