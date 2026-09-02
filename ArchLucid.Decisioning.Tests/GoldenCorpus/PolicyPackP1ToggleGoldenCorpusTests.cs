using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.Governance;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     WK-22 sibling: P1 SOC 2 vs CIS Azure move declaration findings on a fixed graph.
///     Does not switch <see cref="GoldenCorpusHarness"/> off <c>FileComplianceRulePackProvider</c>.
/// </summary>
[Trait("Suite", "Core")]
public sealed class PolicyPackP1ToggleGoldenCorpusTests
{
    [Fact]
    public async Task Bundled_soc2_and_cis_azure_at_p1_emit_different_declaration_findings()
    {
        GraphSnapshot graph = DeclarationPolicyTestGraphs.CreatePublicAccessAndHttpsDisabledGraph();
        PolicyPackContentDocument soc2Content = BundledPolicyPackTestCatalog.WithPriorityFloor(
            BundledPolicyPackTestCatalog.ReadContent("soc2-tsc-architecture.json"),
            PolicyPackRulePriority.P1);
        PolicyPackContentDocument cisContent = BundledPolicyPackTestCatalog.WithPriorityFloor(
            BundledPolicyPackTestCatalog.ReadContent("cis-azure-foundations.json"),
            PolicyPackRulePriority.P1);

        ComplianceRulePack soc2Pack =
            await BundledPolicyPackTestCatalog.LoadFilteredFilePackAsync(soc2Content, CancellationToken.None);
        ComplianceRulePack cisPack =
            await BundledPolicyPackTestCatalog.LoadFilteredFilePackAsync(cisContent, CancellationToken.None);

        IReadOnlyList<Finding> soc2Findings = await RunDeclarationSecurityEngineAsync(soc2Pack, graph);
        IReadOnlyList<Finding> cisFindings = await RunDeclarationSecurityEngineAsync(cisPack, graph);

        soc2Findings.Should().NotBeEmpty();
        cisFindings.Should().NotBeEmpty();

        HashSet<string> soc2RuleIds = ExtractPolicyRuleIds(soc2Findings);
        HashSet<string> cisRuleIds = ExtractPolicyRuleIds(cisFindings);

        soc2RuleIds.Should().Contain("soc2-004");
        cisRuleIds.Should().Contain("cis-az-006");
        soc2RuleIds.Should().NotBeEquivalentTo(cisRuleIds, "P1 SOC 2 vs CIS Azure is the buyer-visible demo arm");
    }

    private static async Task<IReadOnlyList<Finding>> RunDeclarationSecurityEngineAsync(
        ComplianceRulePack filteredPack,
        GraphSnapshot graph)
    {
        FixedComplianceRulePackProvider provider = new(filteredPack);
        DeclarationSecurityBaselineFindingEngine engine = new(provider);

        return await engine.AnalyzeAsync(graph, CancellationToken.None);
    }

    private static HashSet<string> ExtractPolicyRuleIds(IReadOnlyList<Finding> findings)
    {
        HashSet<string> ruleIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in findings)
        {
            if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            {
                ruleIds.Add(finding.PolicyRuleId);
            }
        }

        return ruleIds;
    }
}
