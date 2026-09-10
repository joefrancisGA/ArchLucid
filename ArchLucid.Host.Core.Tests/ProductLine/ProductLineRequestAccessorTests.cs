using ArchLucid.Core.Configuration;
using ArchLucid.Core.ProductLine;
using ArchLucid.Host.Core.ProductLine;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests.ProductLine;

public sealed class ProductLineRequestAccessorTests
{
    [Fact]
    public void GetEffectiveProductLine_without_http_context_uses_deployment()
    {
        ProductLineRequestAccessor accessor = CreateAccessor(
            new ProductLineDeploymentOptions { Deployment = "security" },
            httpContext: null);

        accessor.GetEffectiveProductLine().Should().Be(EffectiveProductLineKind.Security);
    }

    [Fact]
    public void GetEffectiveProductLine_reads_optional_header_when_deployment_is_both()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Request.Headers[ProductLineHttpHeaderNames.Header] = "security";

        ProductLineRequestAccessor accessor = CreateAccessor(
            new ProductLineDeploymentOptions { Deployment = "both" },
            httpContext);

        accessor.GetEffectiveProductLine().Should().Be(EffectiveProductLineKind.Security);
    }

    [Fact]
    public void GetEffectiveProductLine_ignores_escalating_header()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Request.Headers[ProductLineHttpHeaderNames.Header] = "architecture";

        ProductLineRequestAccessor accessor = CreateAccessor(
            new ProductLineDeploymentOptions { Deployment = "security" },
            httpContext);

        accessor.GetEffectiveProductLine().Should().Be(EffectiveProductLineKind.Security);
    }

    private static ProductLineRequestAccessor CreateAccessor(
        ProductLineDeploymentOptions options,
        HttpContext? httpContext)
    {
        HttpContextAccessor httpContextAccessor = new() { HttpContext = httpContext };

        return new ProductLineRequestAccessor(httpContextAccessor, Options.Create(options));
    }
}
