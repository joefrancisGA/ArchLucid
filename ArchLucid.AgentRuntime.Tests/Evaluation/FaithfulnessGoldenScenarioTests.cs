using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

/// <summary>
///     End-to-end AI faithfulness golden scenario suite covering three buyer-recognizable cases:
///     Azure SaaS readiness, AI governance, and regulated-data workflow.
///     Asserts the full chain: evidence refs present, citation coverage acceptable, expected
///     finding categories produced, and no forbidden claims in output.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FaithfulnessGoldenScenarioTests
{
    private static readonly string[] TargetScenarioIds =
    [
        "corpus-azure-saas-readiness",
        "corpus-governance-heavy-review",
        "corpus-regulated-data-workflow",
    ];

    private static readonly JsonSerializerOptions WebJson = new(ContractJson.Default)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentOutputEvaluationHarness _harness = new AgentOutputEvaluationHarness(
        new AgentOutputEvaluator(),
        new HeuristicAgentOutputSemanticEvaluator());

    private readonly FindingClaimCoverageEvaluator _coverageEvaluator =
        new(NullLogger<FindingClaimCoverageEvaluator>.Instance);

    [SkippableFact]
    public void GoldenScenarios_HarnessPassesAndCoverageIsAcceptable()
    {
        string corpusDir = FindEvalCorpusDirectory();
        IReadOnlyList<LoadedScenario> scenarios = LoadTargetScenarios(corpusDir);

        Skip.If(scenarios.Count == 0, "No target buyer scenarios found in eval-corpus.");

        List<ScenarioSummaryEntry> summaryEntries = [];

        foreach (LoadedScenario scenario in scenarios)
        {
            AgentResult agentResult = LoadAgentResult(corpusDir, scenario);

            AgentOutputExpectation expectation = new()
            {
                RequiredJsonKeys = ["evidenceRefs", "findings"],
                MinimumFindingCount = 1
            };

            AgentOutputHarnessResult harnessResult = _harness.Evaluate(
                agentResult.AgentType,
                agentResult,
                expectation);

            FindingClaimCoverageReport coverageReport = _coverageEvaluator.Evaluate(agentResult.Findings);

            summaryEntries.Add(new ScenarioSummaryEntry(
                ScenarioId: scenario.Id,
                Title: scenario.Title,
                HarnessPassed: harnessResult.Passed,
                CitationCoverageRatio: coverageReport.CoverageRatio,
                FindingCount: agentResult.Findings.Count,
                SupportedFindingCount: coverageReport.SupportedFindingCount,
                HeuristicFindingCount: coverageReport.HeuristicFindingCount,
                UnsupportedCount: coverageReport.UnsupportedFindingIds.Count,
                HarnessFailures: harnessResult.Failures.ToList()));

            harnessResult.Passed.Should().BeTrue(
                because: $"scenario '{scenario.Id}' must pass harness evaluation. " +
                         $"Failures: {string.Join("; ", harnessResult.Failures)}");

            coverageReport.CoverageRatio.Should().BeGreaterThan(
                0.0,
                because: $"scenario '{scenario.Id}' must have at least one finding with evidence refs or a heuristic label");
        }

        WriteSummaryArtifact(summaryEntries);
    }

    [SkippableFact]
    public void GoldenScenarios_UnexpectedFindingsAreAbsent()
    {
        string corpusDir = FindEvalCorpusDirectory();
        IReadOnlyList<LoadedScenario> scenarios = LoadTargetScenarios(corpusDir);

        Skip.If(scenarios.Count == 0, "No target buyer scenarios found in eval-corpus.");

        foreach (LoadedScenario scenario in scenarios)
        {
            AgentResult agentResult = LoadAgentResult(corpusDir, scenario);

            foreach (ScenarioUnexpectedFinding unexpectedSpec in scenario.UnexpectedFindings)
            {
                IReadOnlyList<ArchitectureFinding> categoryFindings = agentResult.Findings
                    .Where(f => string.Equals(f.Category, unexpectedSpec.Category, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (ArchitectureFinding finding in categoryFindings)
                {
                    foreach (string forbidden in unexpectedSpec.IfContainsAny)
                    {
                        finding.Message.Should().NotContainEquivalentOf(
                            forbidden,
                            because: $"scenario '{scenario.Id}' finding in category '{unexpectedSpec.Category}' " +
                                     $"must not contain forbidden phrase '{forbidden}'");
                    }
                }
            }
        }
    }

    [SkippableFact]
    public void GoldenScenarios_ExpectedFindingCategoriesArePresent()
    {
        string corpusDir = FindEvalCorpusDirectory();
        IReadOnlyList<LoadedScenario> scenarios = LoadTargetScenarios(corpusDir);

        Skip.If(scenarios.Count == 0, "No target buyer scenarios found in eval-corpus.");

        foreach (LoadedScenario scenario in scenarios)
        {
            AgentResult agentResult = LoadAgentResult(corpusDir, scenario);

            HashSet<string> actualCategories = agentResult.Findings
                .Select(f => f.Category.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (ScenarioExpectedFinding expectedSpec in scenario.ExpectedFindings)
            {
                actualCategories.Should().Contain(
                    expectedSpec.Category,
                    because: $"scenario '{scenario.Id}' must produce a finding in category '{expectedSpec.Category}'");
            }
        }
    }

    private static void WriteSummaryArtifact(IReadOnlyList<ScenarioSummaryEntry> entries)
    {
        string artifactPath = Path.Combine(AppContext.BaseDirectory, "faithfulness-golden-summary.json");

        FaithfulnessSummaryArtifact artifact = new(
            SchemaVersion: 1,
            GeneratedUtc: DateTime.UtcNow,
            Scenarios: entries);

        string json = JsonSerializer.Serialize(artifact, new JsonSerializerOptions { WriteIndented = true });

        File.WriteAllText(artifactPath, json);
    }

    private static IReadOnlyList<LoadedScenario> LoadTargetScenarios(string corpusDir)
    {
        List<LoadedScenario> result = [];

        foreach (string scenarioId in TargetScenarioIds)
        {
            string[] candidates = Directory.GetFiles(corpusDir, "*.json", SearchOption.TopDirectoryOnly);
            string? matchPath = candidates.FirstOrDefault(p =>
            {
                try
                {
                    string json = File.ReadAllText(p);
                    using JsonDocument doc = JsonDocument.Parse(json);

                    if (!doc.RootElement.TryGetProperty("id", out JsonElement idEl))
                        return false;

                    return string.Equals(idEl.GetString(), scenarioId, StringComparison.Ordinal);
                }
                catch
                {
                    return false;
                }
            });

            if (matchPath is null)
                continue;

            LoadedScenario? scenario = ParseScenario(matchPath);

            if (scenario is not null)
                result.Add(scenario);
        }

        return result;
    }

    private static LoadedScenario? ParseScenario(string scenarioPath)
    {
        string json = File.ReadAllText(scenarioPath);

        ScenarioJson? scenarioJson = JsonSerializer.Deserialize<ScenarioJson>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (scenarioJson is null)
            return null;

        return new LoadedScenario(
            Id: scenarioJson.Id ?? string.Empty,
            Title: scenarioJson.Metadata?.Title ?? string.Empty,
            QualityEvidence: scenarioJson.QualityEvidence,
            ExpectedFindings: scenarioJson.ExpectedFindings ?? [],
            UnexpectedFindings: scenarioJson.UnexpectedFindings ?? []);
    }

    private static AgentResult LoadAgentResult(string corpusDir, LoadedScenario scenario)
    {
        string agentResultPath = scenario.QualityEvidence?.AgentResultPath
            ?? throw new InvalidOperationException($"Scenario '{scenario.Id}' has no agentResultPath in qualityEvidence.");

        string fullPath = Path.Combine(corpusDir, agentResultPath);

        File.Exists(fullPath).Should().BeTrue($"agent result file '{agentResultPath}' must exist for scenario '{scenario.Id}'");

        string json = File.ReadAllText(fullPath);
        AgentResult? result = JsonSerializer.Deserialize<AgentResult>(json, WebJson);

        result.Should().NotBeNull($"agent result JSON must deserialize for scenario '{scenario.Id}'");

        return result!;
    }

    private static string FindEvalCorpusDirectory()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
            {
                string root = Path.Combine(dir.FullName, "tests", "eval-corpus");

                if (Directory.Exists(root))
                    return root;

                throw new InvalidOperationException($"tests/eval-corpus not found under repo root {dir.FullName}");
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate ArchLucid.sln in parent directories.");
    }

    // ---------- summary artifact types ----------

    private sealed record FaithfulnessSummaryArtifact(
        int SchemaVersion,
        DateTime GeneratedUtc,
        IReadOnlyList<ScenarioSummaryEntry> Scenarios);

    private sealed record ScenarioSummaryEntry(
        string ScenarioId,
        string Title,
        bool HarnessPassed,
        double CitationCoverageRatio,
        int FindingCount,
        int SupportedFindingCount,
        int HeuristicFindingCount,
        int UnsupportedCount,
        IReadOnlyList<string> HarnessFailures);

    // ---------- scenario deserialization POCOs ----------

    private sealed record LoadedScenario(
        string Id,
        string Title,
        ScenarioQualityEvidence? QualityEvidence,
        IReadOnlyList<ScenarioExpectedFinding> ExpectedFindings,
        IReadOnlyList<ScenarioUnexpectedFinding> UnexpectedFindings);

    private sealed class ScenarioJson
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("metadata")]
        public ScenarioMetadata? Metadata { get; set; }

        [JsonPropertyName("qualityEvidence")]
        public ScenarioQualityEvidence? QualityEvidence { get; set; }

        [JsonPropertyName("expectedFindings")]
        public List<ScenarioExpectedFinding>? ExpectedFindings { get; set; }

        [JsonPropertyName("unexpectedFindings")]
        public List<ScenarioUnexpectedFinding>? UnexpectedFindings { get; set; }
    }

    private sealed class ScenarioMetadata
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
    }

    private sealed class ScenarioQualityEvidence
    {
        [JsonPropertyName("mode")]
        public string? Mode { get; set; }

        [JsonPropertyName("agentResultPath")]
        public string? AgentResultPath { get; set; }
    }

    private sealed class ScenarioExpectedFinding
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("minimumSeverity")]
        public string? MinimumSeverity { get; set; }
    }

    private sealed class ScenarioUnexpectedFinding
    {
        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("ifContainsAny")]
        public List<string> IfContainsAny { get; set; } = [];
    }
}
