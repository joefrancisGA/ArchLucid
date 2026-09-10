using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class ChecklistClusterSynthesisApplicatorTests
{
    [Fact]
    public void Apply_six_https_checklist_rows_emit_one_synthesis_and_preserve_members()
    {
        List<Finding> findings =
        [
            CreateChecklistFinding("https-1", "Enable HTTPS on 'ApiA'", "cis-az-012"),
            CreateChecklistFinding("https-2", "Enable HTTPS on 'ApiB'", "cis-az-012"),
            CreateChecklistFinding("https-3", "Enable HTTPS on 'ApiC'", "cis-az-012"),
            CreateChecklistFinding("https-4", "Enable HTTPS on 'ApiD'", "cis-az-012"),
            CreateChecklistFinding("https-5", "Enable HTTPS on 'ApiE'", "cis-az-012"),
            CreateChecklistFinding("https-6", "Enable HTTPS on 'ApiF'", "cis-az-012"),
        ];

        IReadOnlyList<Finding> synthesisFindings = ChecklistClusterSynthesisApplicator.Apply(findings);

        synthesisFindings.Should().ContainSingle();
        Finding synthesis = synthesisFindings[0];
        synthesis.EngineType.Should().Be(ChecklistClusterSynthesisApplicator.EngineType);
        synthesis.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        synthesis.Title.Should().Contain("6 services");
        synthesis.Trace.Notes.Should().HaveCount(6);
        synthesis.Trace.Notes.Should().OnlyContain(static note => note.StartsWith("evidence:finding:", StringComparison.Ordinal));

        ChecklistClusterSynthesisFindingPayload payload = synthesis.Payload.Should().BeOfType<ChecklistClusterSynthesisFindingPayload>().Subject;
        payload.MemberCount.Should().Be(6);
        payload.MemberFindingIds.Should().HaveCount(6);
        findings.Should().HaveCount(6);
        findings.Should().OnlyContain(static finding => finding.Classification == FindingClassification.ChecklistCoverage);
    }

    [Fact]
    public void Apply_two_rows_does_not_emit_synthesis()
    {
        List<Finding> findings =
        [
            CreateChecklistFinding("https-1", "Enable HTTPS on 'ApiA'", "cis-az-012"),
            CreateChecklistFinding("https-2", "Enable HTTPS on 'ApiB'", "cis-az-012"),
        ];

        ChecklistClusterSynthesisApplicator.Apply(findings).Should().BeEmpty();
    }

    [Fact]
    public void Apply_excludes_decision_grade_rows_from_cluster_members()
    {
        List<Finding> findings =
        [
            CreateChecklistFinding("https-1", "Enable HTTPS on 'ApiA'", "cis-az-012"),
            CreateChecklistFinding("https-2", "Enable HTTPS on 'ApiB'", "cis-az-012"),
            CreateChecklistFinding("https-3", "Enable HTTPS on 'ApiC'", "cis-az-012"),
            CreateDecisionGradeFinding("decision-1", "Enable HTTPS on 'Gateway'", "cis-az-012"),
        ];

        IReadOnlyList<Finding> synthesisFindings = ChecklistClusterSynthesisApplicator.Apply(findings);

        synthesisFindings.Should().ContainSingle();
        ChecklistClusterSynthesisFindingPayload payload =
            synthesisFindings[0].Payload.Should().BeOfType<ChecklistClusterSynthesisFindingPayload>().Subject;
        payload.MemberFindingIds.Should().BeEquivalentTo(["https-1", "https-2", "https-3"]);
        payload.MemberFindingIds.Should().NotContain("decision-1");
    }

    [Fact]
    public void Apply_skips_cluster_when_members_have_no_resolvable_evidence()
    {
        List<Finding> findings =
        [
            CreateChecklistFinding("https-1", "Enable HTTPS on 'ApiA'", policyRuleId: null),
            CreateChecklistFinding("https-2", "Enable HTTPS on 'ApiB'", policyRuleId: null),
            CreateChecklistFinding("https-3", "Enable HTTPS on 'ApiC'", policyRuleId: null),
        ];

        foreach (Finding finding in findings)
        {
            finding.Trace = new ExplainabilityTrace();
        }

        ChecklistClusterSynthesisApplicator.Apply(findings).Should().BeEmpty();
    }

    [Fact]
    public async Task ChecklistClusterStage_appends_synthesis_after_gate()
    {
        List<Finding> checklistFindings = Enumerable.Range(1, 6)
            .Select(index => CreateChecklistFinding($"https-{index}", $"Enable HTTPS on 'Api{index}'", "cis-az-012"))
            .ToList();

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
            },
            Snapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                Findings = checklistFindings,
            },
        };

        FindingsChecklistClusterStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot!.Findings.Should().HaveCount(7);
        context.Snapshot.Findings.Should().ContainSingle(finding =>
            finding.EngineType == ChecklistClusterSynthesisApplicator.EngineType);
        context.SuccessfulEngineTypes.Should().Contain(ChecklistClusterSynthesisApplicator.EngineType);
    }

    [Fact]
    public void ResolveClusterKey_prefers_policy_rule_id()
    {
        Finding finding = CreateChecklistFinding("id-1", "Enable HTTPS on 'ApiA'", "cis-az-012");
        finding.FindingType = "SecurityControlFinding";

        ChecklistClusterSynthesisApplicator.ResolveClusterKey(finding).Should().Be("policy:cis-az-012");
    }

    [Fact]
    public void NormalizeTitleStem_strips_quoted_resource_names()
    {
        ChecklistClusterSynthesisApplicator.NormalizeTitleStem("Enable HTTPS on 'ApiA'")
            .Should().Be("enable https");
    }

    private static Finding CreateChecklistFinding(string findingId, string title, string? policyRuleId)
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "AgentArchitectureFinding-Critic",
            Category = "General",
            EngineType = "Critic",
            Title = title,
            Rationale = title,
            Severity = FindingSeverity.Warning,
            Classification = FindingClassification.ChecklistCoverage,
            Treatment = FindingTreatment.DemoteToChecklist,
            PolicyRuleId = policyRuleId,
            Trace = new ExplainabilityTrace
            {
                Notes = policyRuleId is null
                    ? []
                    : [$"evidence:policy-rule:{policyRuleId}"],
            },
        };
    }

    private static Finding CreateDecisionGradeFinding(string findingId, string title, string policyRuleId)
    {
        Finding finding = CreateChecklistFinding(findingId, title, policyRuleId);
        finding.Classification = FindingClassification.DecisionGradeFinding;
        finding.Treatment = FindingTreatment.Promote;

        return finding;
    }
}
