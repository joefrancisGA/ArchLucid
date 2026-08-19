using ArchLucid.Api.Routing;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Routing;

/// <summary>TB-305 / ADR 0042 unit coverage for <see cref="RunWriteLifecycleRoutes" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunWriteLifecycleRoutesTests
{
    [Theory]
    [InlineData("v{version:apiVersion}/architecture/request")]
    [InlineData("/v{version:apiVersion}/architecture/request")]
    [InlineData("v{version:apiVersion}/architecture/review/{runId}/execute")]
    [InlineData("v{version:apiVersion}/architecture/review/{runId}/finalize")]
    public void IsCanonical_true_for_registered_routes(string template)
    {
        RunWriteLifecycleRoutes.IsCanonical(template).Should().BeTrue();
    }

    [Fact]
    public void IsCanonical_false_for_null_or_unknown()
    {
        RunWriteLifecycleRoutes.IsCanonical(null).Should().BeFalse();
        RunWriteLifecycleRoutes.IsCanonical("v1/health").Should().BeFalse();

        // Deprecated aliases retired with the coordinator strangler migration closure — no longer registered routes.
        RunWriteLifecycleRoutes.IsCanonical("v{version:apiVersion}/requests").Should().BeFalse();
        RunWriteLifecycleRoutes.IsCanonical("v{version:apiVersion}/runs/{runId}/submit").Should().BeFalse();
        RunWriteLifecycleRoutes.IsCanonical("v{version:apiVersion}/runs/{runId}/manifest/finalize").Should().BeFalse();
    }

    [Fact]
    public void All_exposes_exactly_three_lifecycle_operations()
    {
        // Guard against silent growth of the write surface; new operations require an ADR + this assertion update.
        RunWriteLifecycleRoutes.All.Select(route => route.Operation)
            .Should()
            .BeEquivalentTo(["create", "execute", "finalize"]);
    }
}
