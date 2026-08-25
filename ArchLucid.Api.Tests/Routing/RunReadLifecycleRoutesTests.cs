using ArchLucid.Api.Routing;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Routing;

/// <summary>REST API redesign unit coverage for <see cref="RunReadLifecycleRoutes" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunReadLifecycleRoutesTests
{
    [Theory]
    [InlineData("v{version:apiVersion}/runs")]
    [InlineData("/v{version:apiVersion}/runs/{runId:guid}/review-trail")]
    [InlineData("v{version:apiVersion}/runs/{runId:guid}/manifest")]
    [InlineData("v{version:apiVersion}/runs/{runId}/findings")]
    public void IsCanonical_true_for_registered_routes(string template)
    {
        RunReadLifecycleRoutes.IsCanonical(template).Should().BeTrue();
    }

    [Fact]
    public void IsCanonical_false_for_null_or_unknown()
    {
        RunReadLifecycleRoutes.IsCanonical(null).Should().BeFalse();
        RunReadLifecycleRoutes.IsCanonical("v1/authority/reviews").Should().BeFalse();
    }

    [Fact]
    public void All_exposes_eight_canonical_read_operations()
    {
        RunReadLifecycleRoutes.All.Select(route => route.Operation)
            .Should()
            .BeEquivalentTo(
            [
                "list",
                "detail",
                "manifest",
                "review-trail",
                "review-trail-rationale",
                "review-trail-provenance",
                "review-trail-export",
                "findings"
            ]);
    }
}
