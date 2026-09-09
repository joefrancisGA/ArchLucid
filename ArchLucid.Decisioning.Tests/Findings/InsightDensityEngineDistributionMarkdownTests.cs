using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Tests.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Decisioning")]
public sealed class InsightDensityEngineDistributionMarkdownTests
{
    [Fact]
    public void Build_null_rows_throws()
    {
        Action act = () => InsightDensityEngineDistributionMarkdown.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constants_document_harness_and_catalog_sizes()
    {
        InsightDensityEngineDistributionMarkdown.GoldenCorpusHarnessEngineCount.Should().Be(42);
        InsightDensityEngineDistributionMarkdown.BuiltInProductEngineCount.Should().Be(53);
    }

    [Fact]
    public void Build_empty_rows_matches_golden_header_and_table_shell()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([]);

        markdown.Should().Be(
            """
            # Insight-density engine distribution

            claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
            DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
            (penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
            The golden corpus harness registers **42** engines; **0** appear in this table (≥1 finding across case-01..case-65). **53** built-in product engines are absent from this corpus-derived slice.
            `WouldDemoteIfUnprotectedCount` matches production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59).
            `WouldDemoteAt65Count` applies the same predicate at threshold 65; with production default 65 it should match `WouldDemoteIfUnprotectedCount`.

            Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
            Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

            | Engine | Findings | Min | Median | Max | Would demote if unprotected | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |


            """);
    }

    [Fact]
    public void Build_single_row_matches_golden_body_and_data_row()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            CreateRow("compliance", 1, 100, 100, 100, 0, 0, 0, 0, 0, 0),
        ]);

        markdown.Should().Be(
            """
            # Insight-density engine distribution

            claimBoundary: Production gate (ADR 0070) — scores demote typed-engine findings when the predicate fails.
            DeterministicInsightDensityGate applies the demotion predicate to agent and typed-engine findings
            (penalty reason `typed-engine-scored` for engine origin); checklist rows remain on the package snapshot.
            The golden corpus harness registers **42** engines; **1** appear in this table (≥1 finding across case-01..case-65). **52** built-in product engines are absent from this corpus-derived slice.
            `WouldDemoteIfUnprotectedCount` matches production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59).
            `WouldDemoteAt65Count` applies the same predicate at threshold 65; with production default 65 it should match `WouldDemoteIfUnprotectedCount`.

            Advisory scores from deterministic `DeterministicInsightDensityGate` over the decisioning golden corpus.
            Low medians on typed engines signal output quality — demotion to checklist is expected when anchors and evidence are absent.

            | Engine | Findings | Min | Median | Max | Would demote if unprotected | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |
            | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
            | compliance | 1 | 100 | 100 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |


            """);
    }

    [Fact]
    public void Build_distinct_engine_types_are_case_insensitive()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            CreateRow("topology", 2, 80, 85, 90, 0, 1, 2, 0, 0, 1),
            CreateRow("TOPOLOGY", 1, 70, 75, 80, 1, 0, 1, 1, 0, 1),
        ]);

        markdown.Should().Contain("**1** appear in this table");
        markdown.Should().Contain("**52** built-in product engines are absent");
        markdown.Should().Contain("| topology | 2 | 80 | 85 | 90 | 0 | 1 | 2 | 0 | 0 | 1 |");
        markdown.Should().Contain("| TOPOLOGY | 1 | 70 | 75 | 80 | 1 | 0 | 1 | 1 | 0 | 1 |");
    }

    [Fact]
    public void Build_absent_count_never_negative_when_table_exceeds_catalog()
    {
        List<InsightDensityEngineDistributionRow> rows = Enumerable
            .Range(0, 53)
            .Select(index => CreateRow($"engine-{index:D2}", 1, 50, 50, 50, 0, 0, 1, 1, 0, 1))
            .ToList();

        string markdown = InsightDensityEngineDistributionMarkdown.Build(rows);

        markdown.Should().Contain("**53** appear in this table");
        markdown.Should().Contain("**0** built-in product engines are absent");
        markdown.Should().NotContain("**-1**");
    }

    [Fact]
    public void Build_includes_production_threshold_65_claim_boundary()
    {
        string markdown = InsightDensityEngineDistributionMarkdown.Build([
            CreateRow("compliance", 1, 60, 60, 60, 1, 0, 1, 1, 0, 1),
        ]);

        markdown.Should().Contain("production demotion at default `DemotionThreshold` 65 (ADR 0070, DX-59)");
        markdown.Should().Contain("| Would demote at 65 |");
    }

    [Fact]
    public void Library_and_quality_docs_do_not_recite_pre_0070_gate_contract()
    {
        string repoRoot = GoldenCorpusRepoPaths.FindRepoRoot();
        string[] relativePaths =
        [
            "docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md",
            "docs/library/CONFIGURATION_REFERENCE.md",
            "docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md",
            "docs/library/AGENT_EVAL_CORPUS.md",
            "docs/quality/insight-density-engine-distribution.md",
        ];

        string[] forbiddenPhrases =
        [
            "Typed engine findings always promote",
            "always promote (`typed-engine-protected`)",
            "score is advisory for engines",
            "is a counterfactual, not production demotion",
            "never demotes typed-engine findings",
        ];

        foreach (string relativePath in relativePaths)
        {
            string fullPath = Path.Combine(repoRoot, relativePath);
            File.Exists(fullPath).Should().BeTrue($"missing contract doc {relativePath}");

            string content = File.ReadAllText(fullPath);

            foreach (string phrase in forbiddenPhrases)
            {
                content.Should().NotContain(phrase, $"stale gate contract in {relativePath}");
            }
        }
    }

    private static InsightDensityEngineDistributionRow CreateRow(
        string engineType,
        int findingCount,
        int minScore,
        int medianScore,
        int maxScore,
        int wouldDemoteCount,
        int genericAdviceCount,
        int noConcreteEvidenceCount,
        int noArchitectureAnchorCount,
        int duplicationCount,
        int wouldDemoteAt65Count)
    {
        return new InsightDensityEngineDistributionRow
        {
            EngineType = engineType,
            FindingCount = findingCount,
            MinScore = minScore,
            MedianScore = medianScore,
            MaxScore = maxScore,
            WouldDemoteIfUnprotectedCount = wouldDemoteCount,
            GenericAdviceCount = genericAdviceCount,
            NoConcreteEvidenceCount = noConcreteEvidenceCount,
            NoArchitectureAnchorCount = noArchitectureAnchorCount,
            DuplicationCount = duplicationCount,
            WouldDemoteAt65Count = wouldDemoteAt65Count,
        };
    }
}
