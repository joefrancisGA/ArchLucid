using System.Reflection;

using ArchLucid.Api.Middleware;
using ArchLucid.Api.Security;
using ArchLucid.Core.ProductCapability;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests.Security;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ApiPathBasedSkipMiddlewareMatrixTests
{
    public static TheoryData<string> BlockedTraversalPaths { get; } = new()
    {
        "/health/live/../v1/runs",
        "//health/live",
        "/v1/register/%2e%2e/v1/admin",
    };

    [Fact]
    public void Registry_lists_all_guarded_path_skip_components()
    {
        ApiPathBasedSkipComponentRegistry.ComponentIds.Should().HaveCount(8);
        ApiPathBasedSkipComponentRegistry.MiddlewareTypesInAssembly.Should().NotBeEmpty();
        ApiPathBasedSkipComponentRegistry.FilterTypesWithPathSkipInAssembly.Should().Contain(
            typeof(RouteTenantScopeBindingFilter));
    }

    [Fact]
    public void Registry_component_ids_match_guarded_skip_entry_points()
    {
        ApiPathBasedSkipComponentRegistry.ComponentIds.Should().BeEquivalentTo(
        [
            "ScopeResolutionGuardMiddleware.ShouldSkip",
            "TenantErasureQuarantineMiddleware.Skip",
            "TrialSeatReservationMiddleware.SkipSeatAccounting",
            "ProductLineRouteGatePathClassifier.ShouldSkip",
            "RouteTenantScopeBindingFilter.ShouldSkip",
            "ApiRequestMeteringMiddleware.InvokeAsync",
            "ScopeIdentityBindingMiddleware.TryAuthenticateScimBearerForScopeBindingAsync",
            "ContextIngestionMaxPayloadMiddleware.LooksLikeArchitectureCreateRun",
        ]);
    }

    [Theory]
    [MemberData(nameof(BlockedTraversalPaths))]
    public void ContextIngestionMaxPayload_does_not_match_create_run_on_blocked_paths(string path)
    {
        ContextIngestionMaxPayloadMiddleware.LooksLikeArchitectureCreateRun(new PathString(path))
            .Should()
            .BeFalse();
    }

    [Theory]
    [MemberData(nameof(BlockedTraversalPaths))]
    public void ProductLineRouteGate_does_not_skip_on_blocked_paths(string path)
    {
        DefaultHttpContext context = new() { Request = { Path = path } };
        Mock<IProductCapabilityControllerCatalog> catalog = new();
        catalog.Setup(static c => c.AlwaysAllowedRoutePrefixes).Returns([]);

        ProductLineRouteGatePathClassifier.ShouldSkip(context, catalog.Object).Should().BeFalse();
    }

    [Theory]
    [MemberData(nameof(BlockedTraversalPaths))]
    public void TrialSeatReservation_does_not_skip_seat_accounting_on_blocked_paths(string path)
    {
        bool skip = InvokeTrialSeatSkip(new PathString(path));

        skip.Should().BeFalse();
    }

    private static bool InvokeTrialSeatSkip(PathString path)
    {
        MethodInfo? method = typeof(TrialSeatReservationMiddleware).GetMethod(
            "SkipSeatAccounting",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

        method.Should().NotBeNull();

        return (bool)method!.Invoke(null, [path])!;
    }
}
