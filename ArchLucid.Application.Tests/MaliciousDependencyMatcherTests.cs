using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Xunit;

namespace ArchLucid.Application.Tests;

public sealed class MaliciousDependencyMatcherTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    private static DependencyObservation Observation(string? version = "1.2.3",
        DependencyEvidenceKind kind = DependencyEvidenceKind.Resolved) =>
        new("PyPI", "Example_Package", version, kind, "artifact-1", Now.AddDays(-2));
    private static VerifiedMaliciousVersion Advisory(string id = "GHSA-example") =>
        new("pypi", "example-package", "1.2.3", id,
            new Uri("https://example.org/advisory"), Now.AddDays(-1), Now.AddDays(1));

    [Fact]
    public void MatchesHistoricalResolvedEvidenceAndDeduplicatesIds()
    {
        var result = MaliciousDependencyMatcher.Assess(Observation(),
            [Advisory(), Advisory("ghsa-example")], Now, false);
        Assert.Equal(DependencyMatchState.Affected, result.State);
        Assert.Equal("GHSA-EXAMPLE", Assert.Single(result.AdvisoryIds));
        Assert.Equal("artifact-1", result.EvidenceId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(">=1.2.3")]
    [InlineData("1.*")]
    public void UnresolvedVersionsRemainUnknown(string? version) =>
        Assert.Equal(DependencyMatchState.Unknown,
            MaliciousDependencyMatcher.Assess(Observation(version), [Advisory()], Now, true).State);

    [Fact]
    public void DeclaredVersionIsNotInstalledEvidence() =>
        Assert.Equal(DependencyMatchState.Unknown,
            MaliciousDependencyMatcher.Assess(Observation(kind: DependencyEvidenceKind.Declared),
                [Advisory()], Now, true).State);

    [Fact]
    public void StaleAdvisoryCannotEstablishCurrentMatch() =>
        Assert.Equal(DependencyMatchState.Unknown,
            MaliciousDependencyMatcher.Assess(Observation(),
                [Advisory() with { ValidUntil = Now.AddMinutes(-1) }], Now, true).State);

    [Fact]
    public void MissingCatalogCannotEstablishNoMatch() =>
        Assert.Equal(DependencyMatchState.Unknown,
            MaliciousDependencyMatcher.Assess(Observation(), [], Now, false).State);

    [Fact]
    public void DifferentExactVersionDoesNotMatchCompleteCatalog() =>
        Assert.Equal(DependencyMatchState.NotMatched,
            MaliciousDependencyMatcher.Assess(Observation("1.2.4"), [Advisory()], Now, true).State);

    [Fact]
    public void UnsupportedEcosystemRemainsUnknown() =>
        Assert.Equal(DependencyMatchState.Unknown,
            MaliciousDependencyMatcher.Assess(Observation() with { Ecosystem = "npm" },
                [], Now, true).State);
}
