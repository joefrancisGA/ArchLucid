using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     DX-22 sibling: proves checklist-cluster synthesis on findings shaped like the case-46 declaration graph.
///     Merge harness output alone cannot emit synthesis (demoted rows need dismiss posture); this fixture
///     simulates that posture on real engine rows from the golden graph.
/// </summary>
[Trait("Suite", "Core")]
public sealed class ChecklistClusterSynthesisGoldenCorpusTests
{
    private const string SharedPolicyRuleId = "cis-az-012";

    [Fact]
    public async Task Case46_graph_declaration_rows_cluster_into_checklist_synthesis()
    {
        GraphSnapshot graph = GoldenCorpusChecklistClusterGraphFactory.CreateSixHttpsDeclarationClusterGraph();
        string complianceRulesPath = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        FileComplianceRulePackLoader loader = new(complianceRulesPath);
        FileComplianceRulePackProvider complianceProvider = new(loader);
        DeclarationSecurityBaselineFindingEngine declarationEngine = new(complianceProvider);
        IReadOnlyList<Finding> directDeclarationFindings =
            await declarationEngine.AnalyzeAsync(graph, null, CancellationToken.None);

        directDeclarationFindings.Should().HaveCountGreaterThanOrEqualTo(6);

        GoldenCorpusHarness harness = new(complianceRulesPath, TimeProvider.System);
        FindingsSnapshot harnessSnapshot = await harness.GenerateFindingsSnapshotAsync(
            graph.RunId,
            graph.ContextSnapshotId,
            graph,
            CancellationToken.None);

        GoldenCorpusHarnessTestSupport.AllFindings(harnessSnapshot).Should().NotBeEmpty();

        List<Finding> declarationFindings = directDeclarationFindings.Take(6).ToList();

        foreach (Finding finding in declarationFindings)
        {
            finding.Classification = FindingClassification.ChecklistCoverage;
            finding.Treatment = FindingTreatment.DemoteToChecklist;
            finding.PolicyRuleId = SharedPolicyRuleId;
            finding.Trace.Notes.Add($"evidence:policy-rule:{SharedPolicyRuleId}");
        }

        FindingsStageContext context = new()
        {
            RunId = graph.RunId,
            ContextSnapshotId = graph.ContextSnapshotId,
            GraphSnapshot = graph,
            Snapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = graph.RunId,
                ContextSnapshotId = graph.ContextSnapshotId,
                GraphSnapshotId = graph.GraphSnapshotId,
                Findings = declarationFindings.ToList(),
            },
        };

        FindingsChecklistClusterStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        Finding synthesis = context.Snapshot!.Findings.Should().ContainSingle(finding =>
            finding.EngineType == ChecklistClusterSynthesisApplicator.EngineType).Subject;

        ChecklistClusterSynthesisFindingPayload payload =
            synthesis.Payload.Should().BeOfType<ChecklistClusterSynthesisFindingPayload>().Subject;

        payload.MemberCount.Should().BeGreaterThanOrEqualTo(3);
        payload.ClusterKey.Should().Be($"policy:{SharedPolicyRuleId}");
        synthesis.Title.Should().Contain("services");
    }
}
