using System.Globalization;
using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Tests.DriftDetection;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.GoldenCohort;

/// <summary>
///     Bounded real-LLM golden cohort gate: structural contract checks when AOAI credentials are present; skips otherwise.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "GoldenCohort")]
public sealed class GoldenCohortRealLlmQualityGateTests
{
    private const int MaxCohortItems = 5;

    private const int MaxTotalPromptCompletionTokens = 120_000;

    private const double MinEvidenceRefCount = 1;

    [SkippableFact]
    public void Golden_cohort_gate_skips_without_credentials_with_clear_reason()
    {
        if (GoldenCohortRealModeGate.CanRunRealModeDrift())
            Skip.If(true, "Credentials present — use Live_golden_cohort_meets_structural_quality_contract instead.");

        string reason = "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.";

        reason.Should().Contain("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT");
    }

    [SkippableFact]
    public async Task Live_golden_cohort_meets_structural_quality_contract()
    {
        Skip.IfNot(
            GoldenCohortRealModeGate.CanRunRealModeDrift(),
            "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.");

        string cohortPath = Path.Combine(AppContext.BaseDirectory, "golden-cohort", "cohort.json");
        File.Exists(cohortPath).Should().BeTrue($"Missing {cohortPath}");

        GoldenCohortDocument document = GoldenCohortDocument.Load(cohortPath);
        int itemCount = Math.Min(document.Items.Count, MaxCohortItems);

        itemCount.Should().BeGreaterThan(0);

        int budgetCap = GoldenCohortDriftBudgetReader.ResolveMaxTotalPromptCompletionTokens(MaxTotalPromptCompletionTokens);
        budgetCap.Should().BeGreaterThan(0);

        string endpoint = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT")!.Trim();
        string apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_KEY")!.Trim();
        string deployment = GoldenCohortRealModeGate.ResolveDeploymentName();

        using CancellationTokenSource cts = new(TimeSpan.FromMinutes(20));

        int spentTokens = 0;
        List<string> failures = [];

        for (int i = 0; i < itemCount; i++)
        {
            GoldenCohortItem item = document.Items[i];

            if (string.IsNullOrWhiteSpace(item.Title))
            {
                failures.Add($"Item {item.Id}: missing title");
                continue;
            }

            if (item.ExpectedFindingCategories is not { Count: > 0 })
            {
                failures.Add($"Item {item.Id}: expectedFindingCategories required");
                continue;
            }

            if (spentTokens >= budgetCap)
            {
                failures.Add($"Item {item.Id}: token budget exhausted before execution");
                continue;
            }

            ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(item);
            string runId = Guid.NewGuid().ToString("N");

            (RealAgentExecutor executor, GoldenCohortDriftTokenRecorder recorder) =
                GoldenCohortLiveAoaiExecutorFactory.CreateLiveExecutor(endpoint, apiKey, deployment);

            AgentEvidencePackage evidence = GoldenCohortDriftScenarioFixtures.BuildEvidence(runId, request);
            List<AgentTask> tasks = GoldenCohortDriftScenarioFixtures.BuildStandardQuad(runId);

            IReadOnlyList<AgentResult> results;

            try
            {
                results = await executor.ExecuteAsync(runId, request, evidence, tasks, cts.Token);
            }
            catch (Exception ex)
            {
                failures.Add($"Item {item.Id}: execution failed — {ex.Message}");
                continue;
            }

            spentTokens += recorder.TotalPromptCompletionTokens;

            if (spentTokens > budgetCap)
                failures.Add($"Item {item.Id}: post-run token budget exceeded ({spentTokens.ToString(CultureInfo.InvariantCulture)} > {budgetCap.ToString(CultureInfo.InvariantCulture)})");

            foreach (AgentResult result in results)
            {
                string resultJson = JsonSerializer.Serialize(result, ContractJson.Default);

                RealLlmStructuralValidationResult structural =
                    RealLlmOutputStructuralValidator.ValidateAgentResultStructure(result.AgentType.ToString(), resultJson);

                if (!structural.IsValid)
                {
                    string checks = string.Join("; ", structural.Checks.Where(c => !c.Passed).Select(c => c.Name));
                    failures.Add($"Item {item.Id} {result.AgentType}: structural validation — {checks}");
                }

                if (result.EvidenceRefs is null || result.EvidenceRefs.Count < MinEvidenceRefCount)
                {
                    failures.Add(
                        $"Item {item.Id} {result.AgentType}: evidenceRefs count {result.EvidenceRefs?.Count.ToString(CultureInfo.InvariantCulture) ?? "null"} below floor {MinEvidenceRefCount.ToString(CultureInfo.InvariantCulture)}");
                }
            }

            SortedSet<string> actualCategories = GoldenCohortFindingCategoryAggregator.DistinctCategories(results);
            SortedSet<string> expectedCategories = new(StringComparer.Ordinal);

            foreach (string category in item.ExpectedFindingCategories.Where(c => !string.IsNullOrWhiteSpace(c)))
                expectedCategories.Add(category.Trim());

            if (!actualCategories.SetEquals(expectedCategories))
            {
                failures.Add(
                    $"Item {item.Id}: category mismatch expected=[{string.Join(", ", expectedCategories)}] actual=[{string.Join(", ", actualCategories)}]");
            }
        }

        failures.Should().BeEmpty(string.Join("; ", failures));

        string? metricsPath = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_LLM_RUN_METRICS_JSON");

        if (!string.IsNullOrWhiteSpace(metricsPath))
        {
            string? directory = Path.GetDirectoryName(metricsPath);

            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            object metrics = new
            {
                schemaVersion = 1,
                gate = "GoldenCohortRealLlmQualityGate",
                deployment,
                endpointHost = new Uri(endpoint).Host,
                cohortItemsExercised = itemCount,
                promptCompletionTokens = spentTokens,
                tokenBudgetCap = budgetCap,
                qualityDimensions = new[] { "schema", "citation", "faithfulness", "tokenBudget" },
                passed = true,
            };

            await File.WriteAllTextAsync(metricsPath, JsonSerializer.Serialize(metrics));
        }
    }
}
