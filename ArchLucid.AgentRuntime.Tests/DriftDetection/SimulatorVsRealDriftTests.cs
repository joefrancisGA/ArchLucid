using System.Globalization;
using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>
///     Measures structured divergence between <see cref="DeterministicAgentSimulator" /> and live Azure OpenAI runs for a
///     capped subset of <c>tests/golden-cohort/cohort.json</c>. Never fails on qualitative gaps — artifacts record metrics only.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
[Trait("Suite", "GoldenCohort")]
[Trait("Suite", "DriftDetection")]
public sealed class SimulatorVsRealDriftTests
{
    private static readonly JsonSerializerOptions DriftJsonWriteOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    /// <summary>
    ///     Full drift sweep requires AOAI credentials; skipped locally when unset (see <see cref="GoldenCohortRealModeGate" />).
    /// </summary>
    [SkippableFact]
    [SkipIfNoRealMode]
    public async Task Golden_cohort_simulator_vs_real_writes_drift_reports_summary_and_trend()
    {
        Skip.IfNot(
            GoldenCohortRealModeGate.CanRunRealModeDrift(),
            "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY to execute simulator-vs-real drift.");

        string cohortPath = Path.Combine(AppContext.BaseDirectory, "golden-cohort", "cohort.json");

        Assert.True(File.Exists(cohortPath), $"Missing cohort at '{cohortPath}'.");

        GoldenCohortDocument document = GoldenCohortDocument.Load(cohortPath);

        document.Items.Count.Should().BeGreaterThanOrEqualTo(
            3,
            "Golden cohort must contain at least three scenarios for drift reporting.");

        int scenarioCap = ParsePositiveEnvInt("ARCHLUCID_DRIFT_SCENARIO_CAP", 3);
        scenarioCap = Math.Min(scenarioCap, document.Items.Count);

        int budgetCap = GoldenCohortDriftBudgetReader.ResolveMaxTotalPromptCompletionTokens(180000);

        DeterministicAgentSimulator simulator = new();

        string driftDir = GoldenCohortDriftRepoPaths.ResolveDriftReportsDirectory();
        Directory.CreateDirectory(driftDir);

        string endpoint = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT")!.Trim();
        string apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_KEY")!.Trim();
        string deployment = GoldenCohortRealModeGate.ResolveDeploymentName();

        using CancellationTokenSource cts = new(TimeSpan.FromMinutes(25));

        int spentTokens = 0;
        List<GoldenCohortSimulatorVsRealDriftReport> batch = [];

        for (int i = 0; i < scenarioCap; i++)
        {
            GoldenCohortItem item = document.Items[i];
            ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(item);

            string runSim = $"drift-sim-{item.Id}-{Guid.NewGuid():N}";
            AgentEvidencePackage evidenceSim = GoldenCohortDriftScenarioFixtures.BuildEvidence(runSim, request);
            List<AgentTask> tasksSim = GoldenCohortDriftScenarioFixtures.BuildStandardQuad(runSim);

            IReadOnlyList<AgentResult> simResults =
                await simulator.ExecuteAsync(runSim, request, evidenceSim, tasksSim);

            GoldenCohortDriftFindingSummary simSummary = GoldenCohortDriftSignalExtractor.Extract(simResults);

            GoldenCohortDriftFindingSummary realSummary = new();
            string? realErr = null;
            int inTok = 0;
            int outTok = 0;

            if (spentTokens >= budgetCap)
            {
                realErr = "skipped_token_budget_already_consumed";
            }
            else
            {
                try
                {
                    string runReal = Guid.NewGuid().ToString("N");

                    (RealAgentExecutor executor, GoldenCohortDriftTokenRecorder recorder) =
                        GoldenCohortLiveAoaiExecutorFactory.CreateLiveExecutor(endpoint, apiKey, deployment);

                    AgentEvidencePackage evidenceReal = GoldenCohortDriftScenarioFixtures.BuildEvidence(runReal, request);
                    List<AgentTask> tasksReal = GoldenCohortDriftScenarioFixtures.BuildStandardQuad(runReal);

                    IReadOnlyList<AgentResult> realResults =
                        await executor.ExecuteAsync(runReal, request, evidenceReal, tasksReal, cts.Token);

                    realSummary = GoldenCohortDriftSignalExtractor.Extract(realResults);
                    inTok = recorder.InputTokensTotal;
                    outTok = recorder.OutputTokensTotal;
                    spentTokens += recorder.TotalPromptCompletionTokens;

                    if (spentTokens > budgetCap)
                        realErr = string.IsNullOrWhiteSpace(realErr)
                            ? "post_run_token_budget_exceeded"
                            : $"{realErr}; post_run_token_budget_exceeded";
                }
                catch (Exception ex)
                {
                    realErr = ex.Message;
                }
            }

            GoldenCohortSimulatorVsRealDriftReport report = GoldenCohortDriftMetrics.BuildReport(
                item.Id,
                item.Title,
                simSummary,
                realSummary,
                inTok,
                outTok,
                realErr);

            batch.Add(report);

            string outJsonPath = Path.Combine(driftDir, $"{item.Id}-drift.json");
            await File.WriteAllTextAsync(
                outJsonPath,
                JsonSerializer.Serialize(report, DriftJsonWriteOptions),
                cts.Token);

            GoldenCohortDriftSummaryGenerator.AppendTrendEntry(report);
        }

        GoldenCohortDriftSummaryGenerator.RegenerateMarkdownSummary(batch);

        batch.Should().HaveCount(scenarioCap);
    }

    private static int ParsePositiveEnvInt(string name, int defaultValue)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return defaultValue;

        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed) && parsed > 0
            ? parsed
            : defaultValue;
    }
}
