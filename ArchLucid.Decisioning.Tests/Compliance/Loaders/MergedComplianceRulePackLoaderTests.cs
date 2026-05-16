using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Compliance.Loaders;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Compliance.Loaders;

public sealed class MergedComplianceRulePackLoaderTests
{
    [Fact]
    public async Task LoadAsync_merges_rules_from_two_files()
    {
        string dir = Path.Combine(AppContext.BaseDirectory, "Compliance", "RulePacks");
        string defaultFile = Path.Combine(dir, "default-compliance.rules.json");
        string gaFile = Path.Combine(dir, "ga-starter-compliance.rules.json");

        File.Exists(defaultFile).Should().BeTrue($"expected {defaultFile}");
        File.Exists(gaFile).Should().BeTrue($"expected {gaFile}");

        MergedComplianceRulePackLoader sut = new([new FileComplianceRulePackLoader(defaultFile), new FileComplianceRulePackLoader(gaFile)]);

        ComplianceRulePack pack = await sut.LoadAsync(CancellationToken.None);

        pack.Rules.Should().HaveCountGreaterThan(45);
        pack.Rules.Should().Contain(r => r.RuleId == "ai-gov-001");
        pack.Rules.Should().Contain(r => r.RuleId == "sec-base-025");
    }
}
