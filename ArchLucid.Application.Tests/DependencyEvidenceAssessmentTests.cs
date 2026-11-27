using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Xunit;

namespace ArchLucid.Application.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DependencyEvidenceAssessmentTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    private const string Sbom = """
        {"bomFormat":"CycloneDX","components":[
          {"purl":"pkg:nuget/Example@1.2.3.0","version":"1.2.3.0"},
          {"purl":"pkg:npm/example@1.2.3","version":"1.2.3"},
          {"purl":"pkg:pypi/example@1.2.3","version":"1.2.3"}]}
        """;
    private static VerifiedDependencyCatalog Catalog() => new("catalog-1", Now, Now.AddDays(1),
        [new("nuget", "example", "1.2.3", "TEST-1", new Uri("https://example.org/test"), Now, Now.AddDays(1))],
        new HashSet<string>(StringComparer.Ordinal) { "nuget", "npm" });

    [Fact]
    public void MatchesNugetAndScopesNegativeResultsToCompleteEcosystems()
    {
        var result = DependencyEvidenceAssessment.AssessCycloneDx(Sbom, "build-1", Now, Catalog(), Now);
        Assert.True(result.InventoryParsedCompletely);
        Assert.True(result.CatalogCurrent);
        Assert.Equal(3, result.Findings.Count);
        Assert.Equal(DependencyMatchState.Affected, result.Findings[0].Match.State);
        Assert.Equal(DependencyMatchState.NotMatched, result.Findings[1].Match.State);
        Assert.Equal(DependencyMatchState.Unknown, result.Findings[2].Match.State);
    }

    [Fact]
    public void ExpiredCatalogProducesOnlyUnknownResults()
    {
        var result = DependencyEvidenceAssessment.AssessCycloneDx(Sbom, "build-1", Now,
            Catalog(), Now.AddDays(2));
        Assert.False(result.CatalogCurrent);
        Assert.All(result.Findings, item => Assert.Equal(DependencyMatchState.Unknown, item.Match.State));
    }

    [Fact]
    public void NpmStrictStableVersionMatches()
    {
        var result = MaliciousDependencyMatcher.Assess(
            new("npm", "example", "1.2.3", DependencyEvidenceKind.Resolved, "build-1", Now),
            [new("npm", "example", "1.2.3", "TEST", new Uri("https://example.org/test"), Now, Now.AddDays(1))], Now, true);
        Assert.Equal(DependencyMatchState.Affected, result.State);
    }

    [Theory]
    [InlineData("01.2.3")]
    [InlineData("1.2")]
    [InlineData("1.2.3-beta")]
    public void UnsupportedNpmVersionIsUnknown(string version)
    {
        var result = MaliciousDependencyMatcher.Assess(
            new("npm", "example", version, DependencyEvidenceKind.Resolved, "build-1", Now),
            [], Now, true);
        Assert.Equal(DependencyMatchState.Unknown, result.State);
    }
}
