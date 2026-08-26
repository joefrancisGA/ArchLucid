using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     End-to-end regression: tenant filtered compliance keys change declaration-security findings on a fixed graph.
/// </summary>
[Trait("Suite", "Core")]
public sealed class PolicyFilteredDeclarationGoldenCorpusTests
{
    private const string Soc2TransportRuleId = "soc2-004";
    private const string CisAzurePublicAccessRuleId = "cis-az-006";

    [Fact]
    public async Task Policy_filtered_postures_emit_different_declaration_findings()
    {
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        ComplianceRulePack soc2TransportPack = CreatePack(Soc2TransportRuleId);
        ComplianceRulePack cisPublicAccessPack = CreatePack(CisAzurePublicAccessRuleId);

        IReadOnlyList<Finding> transportFindings =
            await RunDeclarationSecurityEngineAsync(soc2TransportPack, graph);
        IReadOnlyList<Finding> publicAccessFindings =
            await RunDeclarationSecurityEngineAsync(cisPublicAccessPack, graph);

        transportFindings.Should().ContainSingle();
        publicAccessFindings.Should().ContainSingle();

        transportFindings[0].PolicyRuleId.Should().Be(Soc2TransportRuleId);
        transportFindings[0].Title.Should().Contain("HTTPS only", because: "transport-security theme");
        transportFindings[0].Title.Contains("public network access", StringComparison.OrdinalIgnoreCase).Should().BeFalse();

        publicAccessFindings[0].PolicyRuleId.Should().Be(CisAzurePublicAccessRuleId);
        publicAccessFindings[0].Title.Should().Contain("public network access", because: "data-protection theme");
        publicAccessFindings[0].Title.Contains("HTTPS only", StringComparison.OrdinalIgnoreCase).Should().BeFalse();
    }

    [Fact]
    public void Tenant_uses_declaration_vocabulary_for_soc2_prefix_without_mapped_theme_key()
    {
        HashSet<string> soc2LogicalAccessOnly = ["soc2-001"];

        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(soc2LogicalAccessOnly).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("data-protection", soc2LogicalAccessOnly).Should().BeFalse();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", soc2LogicalAccessOnly).Should().BeFalse();
    }

    private static async Task<IReadOnlyList<Finding>> RunDeclarationSecurityEngineAsync(
        ComplianceRulePack filteredPack,
        GraphSnapshot graph)
    {
        FixedComplianceRulePackProvider provider = new(filteredPack);
        DeclarationSecurityBaselineFindingEngine engine = new(provider);

        return await engine.AnalyzeAsync(graph, CancellationToken.None);
    }

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "declaration-policy-test",
            Name = "Declaration policy test",
            Version = "1",
            Rules = ruleIds
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
        };
}
