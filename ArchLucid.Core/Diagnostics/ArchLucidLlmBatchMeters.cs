using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidLlmMeters
{
    /// <summary>Estimated USD savings from Batch API discount on offline LLM paths (TB-685).</summary>
    public static readonly Counter<double> LlmBatchEstimatedSavingsUsdTotal =
        ArchLucidAppMeter.Instance.CreateCounter<double>(
            "archlucid_llm_batch_estimated_savings_usd_total",
            description: "Monitoring-grade estimated USD savings from Azure OpenAI Batch API discount on offline paths.");

    /// <summary>Completed Azure OpenAI Batch API jobs (TB-685).</summary>
    public static readonly Counter<long> LlmBatchJobsCompletedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_batch_jobs_completed_total",
            description: "Cumulative Azure OpenAI Batch API jobs completed for offline LLM paths.");

    /// <summary>Records one completed Azure OpenAI Batch API job and estimated savings (TB-685).</summary>
    public static void RecordLlmBatchCompletionRun(
        int requestCount,
        int promptTokens,
        int completionTokens,
        double estimatedSavingsUsd)
    {
        if (requestCount < 1)
            return;

        TagList tags = [];
        tags.Add("path", "offline_batch");

        LlmBatchJobsCompletedTotal.Add(1, tags);
        LlmPromptTokensTotal.Add(promptTokens, tags);
        LlmCompletionTokensTotal.Add(completionTokens, tags);

        if (estimatedSavingsUsd > 0)
            LlmBatchEstimatedSavingsUsdTotal.Add(estimatedSavingsUsd, tags);
    }
}
