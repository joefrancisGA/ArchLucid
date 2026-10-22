using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Executes <c>archlucid real-mode smoke</c> against an HTTP API. Pure HTTP — no docker — so it can run
///     against hosted staging with a service API key and be unit-tested with a <see cref="HttpMessageHandler" /> mock.
/// </summary>
public sealed class RealModeSmokeRunner(HttpClient http)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    public async Task<RealModeSmokeReport> RunAsync(
        RealModeSmokeCommandOptions options,
        CancellationToken ct = default)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        List<RealModeSmokeStepResult> steps = [];
        string? correlationId = null;
        string? runId = null;
        string? finalStatus = null;
        long totalTokens = 0;

        RealModeSmokeHealthProbe healthProbe = new(_http);

        RealModeSmokeStepResult healthLive = await healthProbe.ProbeLiveAsync(ct);
        steps.Add(healthLive);

        if (!healthLive.Passed)
            return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);

        RealModeSmokeStepResult healthReady = await healthProbe.ProbeReadyAsync(ct);
        steps.Add(healthReady);

        if (!healthReady.Passed)
            return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);

        RealModeSmokeCreateRunProbe createProbe = new(_http);
        (RealModeSmokeStepResult createStep, string? createdRunId, string? createCorrelation) =
            await createProbe.ProbeAsync(ct);
        steps.Add(createStep);
        correlationId ??= createCorrelation;
        runId = createdRunId;

        if (!createStep.Passed || string.IsNullOrWhiteSpace(runId))
            return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);

        RealModeSmokeExecuteRunProbe executeProbe = new(_http);
        (RealModeSmokeStepResult executeStep, string? executeCorrelation) =
            await executeProbe.ProbeAsync(runId, ct);
        steps.Add(executeStep);
        correlationId ??= executeCorrelation;

        if (!executeStep.Passed)
            return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);

        RealModeSmokePollRunProbe pollProbe = new(_http);
        (RealModeSmokeStepResult pollStep, string? polledStatus, long polledTokens) =
            await pollProbe.ProbeAsync(runId, options, ct);
        steps.Add(pollStep);
        finalStatus = polledStatus;
        totalTokens = polledTokens;

        if (!pollStep.Passed)
            return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);

        if (options.RequireRealExecutionTokens && totalTokens <= 0)
        {
            steps.Add(new RealModeSmokeStepResult
            {
                Name = "verify-real-execution",
                Passed = false,
                Detail = "Run reached ReadyForCommit but persisted LLM token totals are zero.",
                FailureHint =
                    "Hosted staging should execute agents in real mode. Check AgentExecution:Mode, Azure OpenAI config, and dbo.AgentExecutionTraces for the run.",
            });
        }
        else if (options.RequireRealExecutionTokens)
        {
            steps.Add(new RealModeSmokeStepResult
            {
                Name = "verify-real-execution",
                Passed = true,
                Detail = $"Persisted LLM token totals = {totalTokens} (real-mode signal).",
            });
        }

        return BuildReport(steps, runId, correlationId, finalStatus, totalTokens);
    }

    private static RealModeSmokeReport BuildReport(
        IReadOnlyList<RealModeSmokeStepResult> steps,
        string? runId,
        string? correlationId,
        string? finalStatus,
        long totalTokens) =>
        new()
        {
            Steps = steps,
            AllPassed = steps.All(static s => s.Passed),
            RunId = runId,
            CorrelationId = correlationId,
            FinalRunStatus = finalStatus,
            TotalLlmTokens = totalTokens,
        };
}
