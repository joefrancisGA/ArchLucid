using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.ProductLine;

/// <summary>
///     Honors <c>ProductLine:Deployment</c> and optional <see cref="ProductLineHttpHeaderNames.Header" />.
///     Invalid or conflicting headers are ignored; deployment cannot be escalated by the request.
/// </summary>
public sealed class ProductLineRequestAccessor(
    IHttpContextAccessor httpContextAccessor,
    IOptions<ProductLineDeploymentOptions> options) : IProductLineRequestAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    private readonly ProductLineDeploymentOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public ProductLineDeploymentKind GetDeploymentKind() => _options.ResolveDeploymentKind();

    public EffectiveProductLineKind GetEffectiveProductLine()
    {
        string? headerValue = _httpContextAccessor.HttpContext?.Request.Headers[ProductLineHttpHeaderNames.Header]
            .FirstOrDefault();

        return EffectiveProductLineResolver.Resolve(GetDeploymentKind(), headerValue);
    }
}
