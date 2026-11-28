using ArchLucid.Application.Ingestion;
using ArchLucid.Contracts.Ingestion;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Ingestion;

[Trait("Suite", "Core")]
public sealed class FastPathContextModelBuilderTests
{
    [Fact]
    public void Build_throws_when_url_missing()
    {
        Action act = () => FastPathContextModelBuilder.Build(null);
        act.Should().Throw<ArgumentException>().WithParameterName("rawUrl");
    }

    [Fact]
    public void Build_throws_when_not_absolute_http()
    {
        Action act = () => FastPathContextModelBuilder.Build("not-a-url");
        act.Should().Throw<ArgumentException>().WithParameterName("rawUrl");
    }

    [Theory]
    [InlineData("https://example.test/team/---.git", "Target system")]
    [InlineData("https://example.test/team/___", "Target system")]
    [InlineData("https://example.test/team/_sample__app-", "Sample App")]
    public void Build_names_system_and_default_containers_even_when_slug_has_no_words(
        string repositoryUrl,
        string expectedTitle)
    {
        FastPathContextPreviewResponse result = FastPathContextModelBuilder.Build(repositoryUrl);

        result.SourceUrl.Should().Be(repositoryUrl);
        result.Elements.Should().ContainSingle(e => e.ElementId == "fast-system-1")
            .Which.Name.Should().Be(expectedTitle);
        result.Elements.Should().ContainSingle(e => e.ElementId == "fast-container-app")
            .Which.Name.Should().Be($"{expectedTitle} workload");
        result.Elements.Should().ContainSingle(e => e.ElementId == "fast-container-data")
            .Which.Name.Should().Be($"{expectedTitle} data");
    }

    [Fact]
    public void Build_returns_system_and_containers_for_github_slug()
    {
        FastPathContextPreviewResponse r =
            FastPathContextModelBuilder.Build("https://github.com/contoso/api-gateway.git");

        r.SourceUrl.Should().Be("https://github.com/contoso/api-gateway.git");
        r.Mode.Should().Be("heuristic-v1-not-from-repository");
        r.Elements.Should().Contain(e => e.Kind == "SoftwareSystem" && e.Name.Contains("Api Gateway", StringComparison.Ordinal));
        r.Elements.Should().Contain(e => e.ElementId == "fast-container-api");
    }
}
