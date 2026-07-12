using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.TestSupport.TechnologyConsistency;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TechnologyConsistencyGoldenCorpusTests
{
    private readonly TechnologyConsistencyFindingEngine _engine = new();

    public static TheoryData<string> FindingEngineScenarioPaths =>
        new(TechnologyConsistencyCorpusManifest.LoadFindingEngineScenarios().Select(scenario => scenario.Path));

    [Theory]
    [MemberData(nameof(FindingEngineScenarioPaths))]
    public void Finding_engine_golden_corpus_scenario_matches_expected(string scenarioPath)
    {
        string scenarioDirectory = TechnologyConsistencyCorpusPaths.ScenarioDirectory(scenarioPath);
        List<TechnologyLedgerEntry> ledger = TechnologyConsistencyCorpusLoader.LoadLedger(scenarioDirectory);
        TechnologyConsistencyFindingEngineExpected expected =
            TechnologyConsistencyCorpusLoader.LoadFindingEngineExpected(scenarioDirectory);
        string runId = ledger[0].RunId;

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            runId,
            ledger,
            new TechnologyConsistencyFindingEngineOptions { Mode = expected.Mode });

        AssertFindingEngineExpectations(findings, expected, scenarioPath);
    }

    [Fact]
    public void Revision_coherent_to_drift_v1_clean_v2_emits_provider_family_conflict()
    {
        const string scenarioPath = "finding-engine/revision-coherent-to-drift";
        string scenarioDirectory = TechnologyConsistencyCorpusPaths.ScenarioDirectory(scenarioPath);

        List<TechnologyLedgerEntry> ledgerV1 = TechnologyConsistencyCorpusLoader.LoadLedger(scenarioDirectory, "ledger-v1.json");
        List<TechnologyLedgerEntry> ledgerV2 = TechnologyConsistencyCorpusLoader.LoadLedger(scenarioDirectory, "ledger-v2.json");
        TechnologyConsistencyFindingEngineExpected expectedV1 =
            TechnologyConsistencyCorpusLoader.LoadFindingEngineExpected(scenarioDirectory, "expected-v1.json");
        TechnologyConsistencyFindingEngineExpected expectedV2 =
            TechnologyConsistencyCorpusLoader.LoadFindingEngineExpected(scenarioDirectory, "expected-v2.json");
        string runId = ledgerV1[0].RunId;

        IReadOnlyList<Finding> findingsV1 = _engine.Evaluate(
            runId,
            ledgerV1,
            new TechnologyConsistencyFindingEngineOptions { Mode = expectedV1.Mode });
        IReadOnlyList<Finding> findingsV2 = _engine.Evaluate(
            runId,
            ledgerV2,
            new TechnologyConsistencyFindingEngineOptions { Mode = expectedV2.Mode });

        AssertFindingEngineExpectations(findingsV1, expectedV1, $"{scenarioPath} (v1)");
        AssertFindingEngineExpectations(findingsV2, expectedV2, $"{scenarioPath} (v2)");
    }

    private static void AssertFindingEngineExpectations(
        IReadOnlyList<Finding> findings,
        TechnologyConsistencyFindingEngineExpected expected,
        string scenarioLabel)
    {
        IReadOnlyList<string> actualTitles = findings.Select(finding => finding.Title).OrderBy(title => title).ToList();
        IReadOnlyList<string> expectedTitles = expected.FindingTitles.OrderBy(title => title).ToList();

        actualTitles.Should().BeEquivalentTo(expectedTitles, $"scenario {scenarioLabel}");

        if (expected.MinimumCount is int minimumCount)
            findings.Count.Should().BeGreaterThanOrEqualTo(minimumCount, $"scenario {scenarioLabel}");

        if (expected.MaximumCount is int maximumCount)
            findings.Count.Should().BeLessThanOrEqualTo(maximumCount, $"scenario {scenarioLabel}");

        if (expected.Mode == TechnologyConsistencyFindingEngineMode.WarnOnly)
        {
            foreach (Finding finding in findings)
                finding.Severity.Should().Be(FindingSeverity.Warning, $"scenario {scenarioLabel}");
        }
    }
}
