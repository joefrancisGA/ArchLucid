using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>Resolved metadata types compared against syntax-bound symbols for ARCH001.</summary>
internal readonly struct TenantIdentityBoundaryTypeSymbols
{
    internal TenantIdentityBoundaryTypeSymbols(
        INamedTypeSymbol? httpContext,
        INamedTypeSymbol? httpContextAccessor,
        INamedTypeSymbol? claimsPrincipal)
    {
        HttpContext = httpContext;
        IHttpContextAccessor = httpContextAccessor;
        ClaimsPrincipal = claimsPrincipal;
    }

    internal INamedTypeSymbol? HttpContext
    {
        get;
    }

    internal INamedTypeSymbol? IHttpContextAccessor
    {
        get;
    }

    internal INamedTypeSymbol? ClaimsPrincipal
    {
        get;
    }

    internal bool AnyResolved =>
        HttpContext is not null || IHttpContextAccessor is not null || ClaimsPrincipal is not null;

    internal static TenantIdentityBoundaryTypeSymbols Resolve(Compilation compilation) =>
        new(
            httpContext: compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Http.HttpContext"),
            httpContextAccessor: compilation.GetTypeByMetadataName("Microsoft.AspNetCore.Http.IHttpContextAccessor"),
            claimsPrincipal: compilation.GetTypeByMetadataName("System.Security.Claims.ClaimsPrincipal"));
}
