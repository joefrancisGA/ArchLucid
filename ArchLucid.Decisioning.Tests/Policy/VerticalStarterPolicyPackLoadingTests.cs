using System.Text.Json;

using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Policy;

/// <summary>
/// Ensures repo-shipped vertical starter packs under <c>templates/policy-packs/</c> deserialize and narrow to a non-empty rule set.
/// </summary>
[Trait("Suite", "Core")]
public sealed class VerticalStarterPolicyPackLoadingTests
{
    [Theory]
    [InlineData("financial-services")]
    [InlineData("healthcare")]
    [InlineData("retail")]
    [InlineData("saas")]
    [InlineData("public-sector")]
    public async Task Vertical_starter_compliance_pack_and_policy_pack_materialize_rules(string verticalSlug)
    {
        string compliancePath = Path.Combine(
            AppContext.BaseDirectory,
            "Templates",
            "PolicyPacks",
            verticalSlug,
            "compliance-rules.json");

        string policyPackPath = Path.Combine(
            AppContext.BaseDirectory,
            "Templates",
            "PolicyPacks",
            verticalSlug,
            "policy-pack.json");

        if (!File.Exists(compliancePath))
            throw new FileNotFoundException($"Missing test content: {compliancePath}");

        if (!File.Exists(policyPackPath))
            throw new FileNotFoundException($"Missing test content: {policyPackPath}");

        FileComplianceRulePackLoader loader = new(compliancePath);
        ComplianceRulePack sourcePack = await loader.LoadAsync(CancellationToken.None);

        sourcePack.Rules.Should().NotBeEmpty("vertical compliance-rules.json should list rules");

        string policyJson = await File.ReadAllTextAsync(policyPackPath);
        PolicyPackContentDocument? effective = JsonSerializer.Deserialize<PolicyPackContentDocument>(
            policyJson,
            PolicyPackJsonSerializerOptions.Default);

        if (effective is null)
            throw new InvalidOperationException($"Failed to deserialize policy pack JSON for '{verticalSlug}'.");

        ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(sourcePack, effective);

        filtered.Rules.Should().NotBeEmpty(
            "policy-pack.json complianceRuleKeys should match ruleIds in compliance-rules.json after governance filter");
    }
}
