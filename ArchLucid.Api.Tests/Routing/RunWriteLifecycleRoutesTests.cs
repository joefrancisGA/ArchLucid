using ArchLucid.Api.Routing;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Routing;

/// <summary>TB-305 / ADR 0042 unit coverage for <see cref="RunWriteLifecycleRoutes" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunWriteLifecycleRoutesTests
{
    [Theory]
    [InlineData("v{version:apiVersion}/requests")]
    [InlineData("/v{version:apiVersion}/requests")]
    [InlineData("v{version:apiVersion}/runs/{runId}/submit")]
    [InlineData("v{version:apiVersion}/runs/{runId}/manifest/finalize")]
    public void IsDeprecatedAlias_true_for_known_aliases(string template)
    {
        RunWriteLifecycleRoutes.IsDeprecatedAlias(template).Should().BeTrue();
    }

    [Theory]
    [InlineData("v{version:apiVersion}/architecture/request")]
    [InlineData("v{version:apiVersion}/architecture/run/{runId}/execute")]
    [InlineData("v{version:apiVersion}/architecture/run/{runId}/commit")]
    public void IsDeprecatedAlias_false_for_canonical_routes(string template)
    {
        RunWriteLifecycleRoutes.IsDeprecatedAlias(template).Should().BeFalse();
        RunWriteLifecycleRoutes.IsCanonical(template).Should().BeTrue();
    }

    [Fact]
    public void IsDeprecatedAlias_false_for_null_or_unknown()
    {
        RunWriteLifecycleRoutes.IsDeprecatedAlias(null).Should().BeFalse();
        RunWriteLifecycleRoutes.IsDeprecatedAlias("v1/health").Should().BeFalse();
    }

    [Theory]
    [InlineData("v{version:apiVersion}/requests", "v{version:apiVersion}/architecture/request")]
    [InlineData("v{version:apiVersion}/runs/{runId}/submit", "v{version:apiVersion}/architecture/run/{runId}/execute")]
    [InlineData("v{version:apiVersion}/runs/{runId}/manifest/finalize", "v{version:apiVersion}/architecture/run/{runId}/commit")]
    public void CanonicalFor_maps_alias_to_canonical(string alias, string expectedCanonical)
    {
        RunWriteLifecycleRoutes.CanonicalFor(alias).Should().Be(expectedCanonical);
    }

    [Fact]
    public void CanonicalFor_null_for_non_alias()
    {
        RunWriteLifecycleRoutes.CanonicalFor("v{version:apiVersion}/architecture/request").Should().BeNull();
    }

    [Theory]
    [InlineData("v{version:apiVersion}/requests", "create")]
    [InlineData("v{version:apiVersion}/runs/{runId}/submit", "execute")]
    [InlineData("v{version:apiVersion}/runs/{runId}/manifest/finalize", "commit")]
    public void DeprecatedAliasOperation_maps_alias_to_operation_id(string alias, string expectedOperation)
    {
        RunWriteLifecycleRoutes.DeprecatedAliasOperation(alias).Should().Be(expectedOperation);
    }

    [Fact]
    public void All_exposes_exactly_three_lifecycle_operations()
    {
        // Guard against silent growth of the dual-write surface; new pairs require an ADR + this assertion update.
        RunWriteLifecycleRoutes.All.Select(route => route.Operation)
            .Should()
            .BeEquivalentTo(["create", "execute", "commit"]);

        RunWriteLifecycleRoutes.All.Should().OnlyContain(route => route.DeprecatedAliasTemplates.Count == 1);
    }
}
