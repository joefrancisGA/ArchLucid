using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.TestSupport.TechnologyConsistency;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TechnologyConsistencyArtifactGoldenCorpusTests
{
    private readonly TechnologyLedgerArtifactLinter _linter = new();

    public static TheoryData<string> ArtifactLintScenarioPaths =>
        new(TechnologyConsistencyCorpusManifest.LoadArtifactLintScenarios().Select(scenario => scenario.Path));

    [Theory]
    [MemberData(nameof(ArtifactLintScenarioPaths))]
    public void Artifact_lint_golden_corpus_scenario_matches_expected(string scenarioPath)
    {
        string scenarioDirectory = TechnologyConsistencyCorpusPaths.ScenarioDirectory(scenarioPath);
        List<TechnologyLedgerEntry> ledger = TechnologyConsistencyCorpusLoader.LoadLedger(scenarioDirectory);
        string prose = TechnologyConsistencyCorpusLoader.LoadArtifactProse(scenarioDirectory);
        TechnologyConsistencyArtifactLintExpected expected =
            TechnologyConsistencyCorpusLoader.LoadArtifactLintExpected(scenarioDirectory);

        ArtifactBundle bundle = BundleWithContent(ArtifactType.ArchitectureNarrative, prose);

        IReadOnlyList<TechnologyLedgerArtifactLintFinding> findings = _linter.Lint(
            bundle,
            ledger,
            new TechnologyLedgerArtifactLintOptions { Mode = expected.Mode });

        IReadOnlyList<string> actualRuleIds = findings
            .Select(finding => finding.RuleId)
            .Distinct()
            .OrderBy(ruleId => ruleId)
            .ToList();
        IReadOnlyList<string> expectedRuleIds = expected.RuleIds.OrderBy(ruleId => ruleId).ToList();

        actualRuleIds.Should().BeEquivalentTo(expectedRuleIds, $"scenario {scenarioPath}");
    }

    private static ArtifactBundle BundleWithContent(string artifactType, string content)
    {
        return new ArtifactBundle
        {
            BundleId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Artifacts = [Artifact(artifactType, content)],
        };
    }

    private static SynthesizedArtifact Artifact(string artifactType, string content)
    {
        return new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            ArtifactType = artifactType,
            Name = $"{artifactType}.md",
            Content = content,
            ContentHash = "hash",
        };
    }
}
