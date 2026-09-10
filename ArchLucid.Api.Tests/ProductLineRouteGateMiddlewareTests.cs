using System.Reflection;
using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Controllers.Findings;
using ArchLucid.Api.Middleware;
using ArchLucid.Core.ProductCapability;
using ArchLucid.Core.ProductLine;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProductLineRouteGateMiddlewareTests
{
    private static readonly string RunsControllerTypeName =
        "ArchLucid.Api.Controllers.Authority.RunsController";

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/openapi/v1.json")]
    [InlineData("/v1/register")]
    [InlineData("/robots.txt")]
    public async Task InvokeAsync_skip_paths_call_next(string path)
    {
        bool nextCalled = false;
        ProductLineRouteGateMiddleware middleware = new(_ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        DefaultHttpContext context = CreateHttpContext(
            path,
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Security,
            mapProductLine: "architecture");

        await middleware.InvokeAsync(
            context,
            context.RequestServices.GetRequiredService<IProductLineRequestAccessor>(),
            context.RequestServices.GetRequiredService<IProductCapabilityControllerCatalog>());

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_security_effective_line_blocks_architecture_controller()
    {
        DefaultHttpContext context = CreateHttpContext(
            "/v1/architecture/model-engine-selection-options",
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Security,
            mapProductLine: "architecture",
            controllerTypeName: RunsControllerTypeName);

        await InvokeMiddlewareAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    public async Task InvokeAsync_security_effective_line_allows_both_controller()
    {
        bool nextCalled = false;
        ProductLineRouteGateMiddleware middleware = new(_ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        DefaultHttpContext context = CreateHttpContext(
            "/v1/findings/finding-1/inspect",
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Security,
            mapProductLine: "both",
            controllerTypeName: "ArchLucid.Api.Controllers.Findings.FindingInspectController");

        await middleware.InvokeAsync(
            context,
            context.RequestServices.GetRequiredService<IProductLineRequestAccessor>(),
            context.RequestServices.GetRequiredService<IProductCapabilityControllerCatalog>());

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_architecture_effective_line_allows_architecture_controller()
    {
        bool nextCalled = false;
        ProductLineRouteGateMiddleware middleware = new(_ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        DefaultHttpContext context = CreateHttpContext(
            "/v1/architecture/model-engine-selection-options",
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Architecture,
            mapProductLine: "architecture",
            controllerTypeName: RunsControllerTypeName);

        await middleware.InvokeAsync(
            context,
            context.RequestServices.GetRequiredService<IProductLineRequestAccessor>(),
            context.RequestServices.GetRequiredService<IProductCapabilityControllerCatalog>());

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_disputed_map_row_allows_security_effective_line()
    {
        bool nextCalled = false;
        ProductLineRouteGateMiddleware middleware = new(_ =>
        {
            nextCalled = true;

            return Task.CompletedTask;
        });

        DefaultHttpContext context = CreateHttpContext(
            "/v1/example",
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Security,
            mapProductLine: "disputed",
            controllerTypeName: RunsControllerTypeName);

        await middleware.InvokeAsync(
            context,
            context.RequestServices.GetRequiredService<IProductLineRequestAccessor>(),
            context.RequestServices.GetRequiredService<IProductCapabilityControllerCatalog>());

        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_unmapped_controller_returns_500()
    {
        DefaultHttpContext context = CreateHttpContext(
            "/v1/example",
            AuthenticatedPrincipal(),
            effectiveProductLine: EffectiveProductLineKind.Security,
            mapProductLine: null,
            controllerTypeName: "ArchLucid.Api.Controllers.Example.UnmappedController");

        await InvokeMiddlewareAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    private static async Task InvokeMiddlewareAsync(DefaultHttpContext context)
    {
        ProductLineRouteGateMiddleware middleware = new(_ => Task.CompletedTask);

        await middleware.InvokeAsync(
            context,
            context.RequestServices.GetRequiredService<IProductLineRequestAccessor>(),
            context.RequestServices.GetRequiredService<IProductCapabilityControllerCatalog>());
    }

    private static DefaultHttpContext CreateHttpContext(
        string path,
        ClaimsPrincipal user,
        EffectiveProductLineKind effectiveProductLine,
        string? mapProductLine,
        string? controllerTypeName = null)
    {
        DefaultHttpContext http = new()
        {
            Request = { Path = path },
            User = user,
            Response = { Body = new MemoryStream() },
        };

        Mock<IProductLineRequestAccessor> productLineAccessor = new();
        productLineAccessor.Setup(accessor => accessor.GetEffectiveProductLine()).Returns(effectiveProductLine);
        productLineAccessor.Setup(accessor => accessor.GetDeploymentKind()).Returns(ProductLineDeploymentKind.Both);

        string resolvedControllerTypeName = controllerTypeName ?? RunsControllerTypeName;

        Mock<IProductCapabilityControllerCatalog> catalog = new();
        catalog.Setup(static catalogInstance => catalogInstance.AlwaysAllowedRoutePrefixes)
            .Returns(new[] { "/health", "/openapi" });

        Type controllerType = ResolveControllerType(resolvedControllerTypeName);
        string lookupTypeName = controllerType.FullName ?? resolvedControllerTypeName;

        if (mapProductLine is not null)
        {
            string resolvedProductLine = mapProductLine;
            catalog.Setup(catalogInstance => catalogInstance.TryGetControllerProductLine(lookupTypeName, out resolvedProductLine))
                .Returns(true);
        }
        else
        {
            string resolvedProductLine = string.Empty;
            catalog.Setup(catalogInstance => catalogInstance.TryGetControllerProductLine(lookupTypeName, out resolvedProductLine))
                .Returns(false);
        }

        ControllerActionDescriptor actionDescriptor = new()
        {
            ControllerTypeInfo = controllerType.GetTypeInfo(),
        };

        Endpoint endpoint = new(
            requestDelegate: _ => Task.CompletedTask,
            metadata: new EndpointMetadataCollection(actionDescriptor),
            displayName: lookupTypeName);

        http.SetEndpoint(endpoint);

        ServiceCollection services = [];
        services.AddSingleton(productLineAccessor.Object);
        services.AddSingleton(catalog.Object);
        services.AddSingleton<IProductLineRequestAccessor>(productLineAccessor.Object);
        services.AddSingleton<IProductCapabilityControllerCatalog>(catalog.Object);
        http.RequestServices = services.BuildServiceProvider();

        return http;
    }

    private static ClaimsPrincipal AuthenticatedPrincipal()
    {
        return new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "tester")], "Bearer"));
    }

    private static Type ResolveControllerType(string controllerTypeName)
    {
        if (controllerTypeName == RunsControllerTypeName)
        {
            return typeof(RunsController);
        }

        if (controllerTypeName == "ArchLucid.Api.Controllers.Findings.FindingInspectController")
        {
            return typeof(FindingInspectController);
        }

        return typeof(ProductLineRouteGateMiddlewareTests);
    }
}
