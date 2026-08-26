using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSignalPolicyFindingEngineTests
{
    [Fact]
    public async Task Declaration_security_emits_all_signals_when_pack_has_unmapped_prefix()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cost-opt-001"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().HaveCount(2);
        findings.Should().Contain(f => f.Title.Contains("public network access", StringComparison.OrdinalIgnoreCase));
        findings.Should().Contain(f => f.Title.Contains("HTTPS only", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Declaration_security_with_soc2_001_only_suppresses_unmapped_themes()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("soc2-001"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task Declaration_security_with_cis_az_006_only_emits_public_access_not_https()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-006"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("public network access", because: "data-protection theme");
        findings[0].PolicyRuleId.Should().Be("cis-az-006");
        findings[0].Trace.RulesApplied.Should().Contain("cis-az-006");
    }

    [Fact]
    public async Task Declaration_security_with_cis_az_025_only_emits_https_not_public_access()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-025"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("HTTPS only", because: "transport-security theme");
        findings[0].PolicyRuleId.Should().Be("cis-az-025");
    }

    [Fact]
    public async Task Declaration_security_with_soc2_004_only_emits_https_not_public_access()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("soc2-004"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("HTTPS only", because: "transport-security theme");
        findings[0].PolicyRuleId.Should().Be("soc2-004");
    }

    [Fact]
    public async Task Declaration_security_with_soc2_018_only_emits_public_access_not_https()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("soc2-018"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("public network access", because: "data-protection theme");
        findings[0].PolicyRuleId.Should().Be("soc2-018");
    }

    [Fact]
    public async Task Declaration_security_with_hipaa_024_only_emits_transport_not_data_protection()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("hipaa-024"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("HTTPS only", because: "transport-security theme");
        findings[0].PolicyRuleId.Should().Be("hipaa-024");
    }

    [Fact]
    public async Task Declaration_security_with_cis_aws_006_only_emits_public_access_not_https()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-aws-006"));
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("public network access", because: "data-protection theme");
        findings[0].PolicyRuleId.Should().Be("cis-aws-006");
    }

    [Fact]
    public async Task Declaration_security_with_empty_filtered_pack_emits_nothing()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack());
        DeclarationSecurityBaselineFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task Premise_conflict_uses_same_policy_gate_as_baseline_engine()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-006"));
        DeclarationPremiseConflictFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePrivateBaselinePublicDeclarationGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].PolicyRuleId.Should().Be("cis-az-006");
    }

    [Fact]
    public async Task Premise_conflict_suppressed_when_theme_not_in_filtered_pack()
    {
        FixedComplianceRulePackProvider provider = new(CreatePack("cis-az-025"));
        DeclarationPremiseConflictFindingEngine sut = new(provider);
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePrivateBaselinePublicDeclarationGraph();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void Declaration_signal_policy_key_map_covers_expected_themes_and_prefix_family()
    {
        HashSet<string> cis006 = ["cis-az-006"];
        HashSet<string> cis025 = ["cis-az-025"];
        HashSet<string> soc2One = ["soc2-001"];
        HashSet<string> soc2Four = ["soc2-004"];
        HashSet<string> costOpt = ["cost-opt-001"];

        DeclarationSignalPolicyKeyMap.IsThemeEnabled("data-protection", cis006).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", cis006).Should().BeFalse();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", cis025).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(cis006).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(soc2One).Should().BeTrue();
        DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary(costOpt).Should().BeFalse();
        DeclarationSignalPolicyKeyMap.IsThemeEnabled("transport-security", soc2Four).Should().BeTrue();
        DeclarationSignalPolicyPrefixFamily.RuleIdMatchesFamily("soc2-001").Should().BeTrue();
        DeclarationSignalPolicyPrefixFamily.RuleIdMatchesFamily("cost-opt-001").Should().BeFalse();
    }

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test",
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
