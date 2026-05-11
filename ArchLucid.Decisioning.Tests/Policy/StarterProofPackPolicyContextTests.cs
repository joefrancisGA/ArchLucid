using System.Text.Json;

using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Policy;

/// <summary>
///     Each starter pack’s <c>policy-context.json</c> must reference a vertical slug that materializes compliance rules
///     (same invariant as <see cref="VerticalStarterPolicyPackLoadingTests" />).
/// </summary>
[Trait("Suite", "Core")]
public sealed class StarterProofPackPolicyContextTests
{
    private sealed class PolicyContextFile
    {
        public string PolicyPackVerticalSlug
        {
            get;
            init;
        } = string.Empty;

        public string PolicyPackRelativePath
        {
            get;
            init;
        } = string.Empty;

        public string Intent
        {
            get;
            init;
        } = string.Empty;
    }

    public static TheoryData<string> StarterPolicyContextRelativePaths =>
    [
        Path.Combine("Templates", "StarterProofPacks", "regulated-saas-soc-procurement", "policy-context.json"),
        Path.Combine("Templates", "StarterProofPacks", "healthcare-data-workflow", "policy-context.json"),
        Path.Combine("Templates", "StarterProofPacks", "azure-cost-governance", "policy-context.json"),
        Path.Combine("Templates", "StarterProofPacks", "ai-llm-workload", "policy-context.json")
    ];

    [Theory]
    [MemberData(nameof(StarterPolicyContextRelativePaths))]
    public async Task Starter_policy_context_vertical_maps_to_nonempty_filtered_rules(string relativePath)
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Copy template to test output: {fullPath}");

        string json = await File.ReadAllTextAsync(fullPath);
        PolicyContextFile? ctx = JsonSerializer.Deserialize<PolicyContextFile>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        ctx.Should().NotBeNull();
        string slug = (ctx.PolicyPackVerticalSlug).Trim();
        slug.Should().NotBeNullOrWhiteSpace();

        string compliancePath = Path.Combine(
            AppContext.BaseDirectory,
            "Templates",
            "PolicyPacks",
            slug,
            "compliance-rules.json");

        string policyPackPath = Path.Combine(
            AppContext.BaseDirectory,
            "Templates",
            "PolicyPacks",
            slug,
            "policy-pack.json");

        File.Exists(compliancePath).Should().BeTrue($"missing {compliancePath}");
        File.Exists(policyPackPath).Should().BeTrue($"missing {policyPackPath}");

        FileComplianceRulePackLoader loader = new(compliancePath);
        ComplianceRulePack sourcePack = await loader.LoadAsync(CancellationToken.None);

        sourcePack.Rules.Should().NotBeEmpty();

        string policyJson = await File.ReadAllTextAsync(policyPackPath);
        PolicyPackContentDocument? effective = JsonSerializer.Deserialize<PolicyPackContentDocument>(
            policyJson,
            PolicyPackJsonSerializerOptions.Default);

        effective.Should().NotBeNull();

        ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(sourcePack, effective);

        filtered.Rules.Should().NotBeEmpty(
            "starter policy-context vertical must match policy-pack.json rule keys after governance filter");
    }
}
