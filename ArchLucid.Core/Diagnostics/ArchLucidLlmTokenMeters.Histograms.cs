using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidLlmMeters
{
    /// <summary>LLM completion calls made during a single <c>RealAgentExecutor.ExecuteAsync</c> batch.</summary>
    public static readonly Histogram<int> LlmCallsPerRun =
        ArchLucidAppMeter.Instance.CreateHistogram<int>(
            "archlucid_llm_calls_per_run",
            "{call}",
            "Number of LLM completion calls made during a single authority run.");

    /// <summary>Completion token distribution tagged by agent consume role and invoke kind (TB-015).</summary>
    public static readonly Histogram<long> LlmCompletionTokensDimensional =
        ArchLucidAppMeter.Instance.CreateHistogram<long>(
            "archlucid.llm.completion_tokens",
            description: "Completion token distribution tagged by archlucid.llm.consume_role and archlucid.llm.invoke_kind.");

    /// <summary>
    ///     End-to-end latency for outbound GenAI operations (chat completions and embedding RPCs; labels
    ///     <c>gen_ai.operation.name</c>, <c>status</c>).
    /// </summary>
    public static readonly Histogram<double> LlmGenAiOperationDurationMilliseconds =
        ArchLucidAppMeter.Instance.CreateHistogram<double>(
            "archlucid_llm_gen_ai_operation_duration_ms",
            "ms",
            "Wall time for GenAI client operations (complements HTTP client spans; no prompt or completion text).");

    /// <summary>
    ///     Associates <paramref name="accumulator" /> with the current async flow so the agent host&apos;s completion client
    ///     can count remote completions toward <see cref="LlmCallsPerRun" />. Dispose to detach.
    /// </summary>
    public static IDisposable BeginLlmCallsPerRunAccumulation(AgentExecutionLlmCallAccumulator accumulator)
    {
        ArgumentNullException.ThrowIfNull(accumulator);

        LlmCallsPerRunAccumulator.Value = accumulator;

        return new LlmCallsPerRunAccumulationScope();
    }

    /// <summary>Increments the current batch&apos;s LLM completion count when an accumulator scope is active.</summary>
    public static void RecordLlmCompletionCallForCurrentRunBatch()
    {
        AgentExecutionLlmCallAccumulator? acc = LlmCallsPerRunAccumulator.Value;

        acc?.AddCompletions(1);
    }

    /// <summary>
    ///     Records <see cref="LlmGenAiOperationDurationMilliseconds" /> for chat or embeddings (low-cardinality
    ///     <paramref name="operationName" />: <c>chat</c> or <c>embeddings</c>).
    /// </summary>
    public static void RecordLlmGenAiOperationDurationMilliseconds(
        string operationName,
        double durationMilliseconds,
        bool succeeded)
    {
        string op = string.IsNullOrWhiteSpace(operationName) ? "unknown" : operationName.Trim();

        if (op is not ("chat" or "embeddings"))
            throw new ArgumentOutOfRangeException(
                nameof(operationName),
                operationName,
                "operationName must be chat or embeddings.");

        if (durationMilliseconds < 0 || double.IsNaN(durationMilliseconds) || double.IsInfinity(durationMilliseconds))
            return;

        TagList tags = new()
        {
            { "gen_ai.operation.name", op },
            { "status", succeeded ? "ok" : "error" }
        };

        LlmGenAiOperationDurationMilliseconds.Record(durationMilliseconds, tags);
    }

    private readonly struct LlmCallsPerRunAccumulationScope : IDisposable
    {
        public void Dispose()
        {
            LlmCallsPerRunAccumulator.Value = null;
        }
    }
}
