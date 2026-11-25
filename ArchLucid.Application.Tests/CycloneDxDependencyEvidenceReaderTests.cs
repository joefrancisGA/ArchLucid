using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Xunit;

namespace ArchLucid.Application.Tests;

public sealed class CycloneDxDependencyEvidenceReaderTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ReadsNestedResolvedComponentsWithArtifactProvenance()
    {
        var result = CycloneDxDependencyEvidenceReader.Read("""
            {"bomFormat":"CycloneDX","components":[
              {"purl":"pkg:pypi/example@1.2.3","version":"1.2.3","components":[
                {"purl":"pkg:pypi/child@2.0","version":"2.0"}]}]}
            """, "build-42", Now);
        Assert.True(result.Complete);
        Assert.Equal(2, result.Observations.Count);
        Assert.All(result.Observations, item =>
        {
            Assert.Equal("build-42", item.EvidenceId);
            Assert.Equal(Now, item.ObservedAt);
            Assert.Equal(DependencyEvidenceKind.Resolved, item.Kind);
        });
    }

    [Theory]
    [InlineData("{")]
    [InlineData("[]")]
    [InlineData("{\"bomFormat\":\"CycloneDX\",\"components\":{}}")]
    public void InvalidInventoryIsIncomplete(string json)
    {
        var result = CycloneDxDependencyEvidenceReader.Read(json, "build-42", Now);
        Assert.False(result.Complete);
        Assert.Empty(result.Observations);
    }

    [Fact]
    public void UnsupportedOrConflictingPurlsDoNotEstablishCompleteness()
    {
        var result = CycloneDxDependencyEvidenceReader.Read("""
            {"bomFormat":"CycloneDX","components":[
              {"purl":"pkg:unsupported/foo@1.0","version":"1.0"},
              {"purl":"pkg:pypi/foo@1.0","version":"2.0"},
              {"purl":"pkg:pypi/bar@2.0","version":"2.0"}]}
            """, "build-42", Now);
        Assert.False(result.Complete);
        Assert.Equal("bar", Assert.Single(result.Observations).Package);
    }

    [Theory]
    [InlineData("01.2.3.0", 0)]
    [InlineData("1.2.3rc1", 2)]
    [InlineData("1.2.4", 1)]
    public void NumericReleaseEquivalenceIsConservative(string version, int expected)
    {
        var result = MaliciousDependencyMatcher.Assess(
            new("pypi", "example", version, DependencyEvidenceKind.Resolved, "build-42", Now),
            [new("pypi", "example", "1.2.3", "test", new Uri("https://example.org/advisory"),
                Now, Now.AddDays(1))], Now, true);
        Assert.Equal((DependencyMatchState)expected, result.State);
    }
}
