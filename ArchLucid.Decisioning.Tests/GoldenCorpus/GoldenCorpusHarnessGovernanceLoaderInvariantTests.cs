using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>WK-22: merge-blocking harness must not depend on production governance loader (WK-09 companion).</summary>
[Trait("Suite", "Core")]
public sealed class GoldenCorpusHarnessGovernanceLoaderInvariantTests
{
    [Fact]
    public void Harness_source_uses_file_compliance_provider_not_effective_governance_loader()
    {
        string harnessPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "GoldenCorpus", "GoldenCorpusHarness.cs"));
        File.Exists(harnessPath).Should().BeTrue("GoldenCorpusHarness.cs must exist for the invariant guard");

        string source = File.ReadAllText(harnessPath);

        source.Should().Contain("FileComplianceRulePackProvider");
        source.Should().NotContain("IEffectiveGovernanceLoader");
        source.Should().NotContain("PolicyFilteredComplianceRulePackProvider");
    }
}
