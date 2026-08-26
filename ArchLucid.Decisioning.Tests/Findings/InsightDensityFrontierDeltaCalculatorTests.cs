using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class InsightDensityFrontierDeltaCalculatorTests
{
    [Fact]
    public void Calculate_all_findings_novel_when_baseline_empty()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Cost", "Overprovisioned VM SKU", null),
                CreateFinding("f2", "topology", "Reliability", "Missing geo-redundant backup", null),
            ],
        };

        FrontierDeltaSignal signal = InsightDensityFrontierDeltaCalculator.Calculate(
            snapshot,
            [],
            InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold);

        signal.TotalFindingCount.Should().Be(2);
        signal.CoveredByBaselineCount.Should().Be(0);
        signal.NovelFindingCount.Should().Be(2);
        signal.NoveltyPercentage.Should().Be(100.0);
    }

    [Fact]
    public void Calculate_all_findings_covered_when_baseline_matches_every_row()
    {
        List<FrontierBaselineFinding> baseline = [
            new() { Category = "Security", Title = "Enable MFA for privileged accounts" },
            new() { Category = "Security", Title = "Use Azure Key Vault for secrets" },
        ];

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "compliance", "Security", "Enable MFA for privileged accounts", null),
                CreateFinding("f2", "compliance", "Security", "Use Azure Key Vault for secrets", null),
            ],
        };

        FrontierDeltaSignal signal = InsightDensityFrontierDeltaCalculator.Calculate(
            snapshot,
            baseline,
            InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold);

        signal.TotalFindingCount.Should().Be(2);
        signal.CoveredByBaselineCount.Should().Be(2);
        signal.NovelFindingCount.Should().Be(0);
        signal.NoveltyPercentage.Should().Be(0.0);
    }

    [Fact]
    public void Calculate_rule_id_match_covers_even_when_title_differs()
    {
        List<FrontierBaselineFinding> baseline = [
            new() { Category = "Security", Title = "Different title text", RuleId = "rule.storage.public" },
        ];

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding(
                    "f1",
                    "declaration-security-baseline",
                    "Security",
                    "Public blob access enabled on storage account",
                    "rule.storage.public"),
            ],
        };

        FrontierDeltaSignal signal = InsightDensityFrontierDeltaCalculator.Calculate(
            snapshot,
            baseline,
            InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold);

        signal.CoveredByBaselineCount.Should().Be(1);
        signal.NovelFindingCount.Should().Be(0);
    }

    [Fact]
    public void Calculate_excludes_checklist_coverage_rows_from_novelty_count()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Cost", "Novel cost finding", null),
                CreateFinding(
                    "f2",
                    "topology",
                    "Security",
                    "Checklist hygiene row",
                    null,
                    FindingClassification.ChecklistCoverage),
            ],
        };

        FrontierDeltaSignal signal = InsightDensityFrontierDeltaCalculator.Calculate(
            snapshot,
            [],
            InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold);

        signal.TotalFindingCount.Should().Be(1);
        signal.NovelFindingCount.Should().Be(1);
    }

    [Fact]
    public void Calculate_rolls_up_per_engine_novelty()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("f1", "topology", "Cost", "Novel topology finding", null),
                CreateFinding("f2", "topology", "Reliability", "Another novel topology finding", null),
                CreateFinding("f3", "compliance", "Security", "Enable MFA for privileged accounts", null),
            ],
        };

        List<FrontierBaselineFinding> baseline = [
            new() { Category = "Security", Title = "Enable MFA for privileged accounts" },
        ];

        FrontierDeltaSignal signal = InsightDensityFrontierDeltaCalculator.Calculate(
            snapshot,
            baseline,
            InsightDensityFrontierDeltaCalculator.DefaultMatchSimilarityThreshold);

        signal.ByEngine.Should().HaveCount(2);

        FrontierDeltaEngineRow topologyRow = signal.ByEngine.Single(r => r.EngineType == "topology");
        topologyRow.FindingCount.Should().Be(2);
        topologyRow.NovelFindingCount.Should().Be(2);
        topologyRow.NoveltyPercentage.Should().Be(100.0);

        FrontierDeltaEngineRow complianceRow = signal.ByEngine.Single(r => r.EngineType == "compliance");
        complianceRow.FindingCount.Should().Be(1);
        complianceRow.NovelFindingCount.Should().Be(0);
        complianceRow.NoveltyPercentage.Should().Be(0.0);
    }

    private static Finding CreateFinding(
        string findingId,
        string engineType,
        string category,
        string title,
        string? policyRuleId,
        FindingClassification classification = FindingClassification.DecisionGradeFinding)
    {
        return new Finding
        {
            FindingId = findingId,
            EngineType = engineType,
            Category = category,
            Title = title,
            PolicyRuleId = policyRuleId,
            Classification = classification,
            FindingType = "test",
            Severity = FindingSeverity.Warning,
            Rationale = "test",
        };
    }
}
