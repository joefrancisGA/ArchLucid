namespace ArchLucid.AgentRuntime.Batch;

/// <summary>Telemetry and artifact metadata for a completed batch completion run.</summary>
public sealed class BatchAgentCompletionRunSummary
{
    public required string BatchJobId
    {
        get;
        init;
    }

    public required int RequestCount
    {
        get;
        init;
    }

    public int TotalPromptTokens
    {
        get;
        init;
    }

    public int TotalCompletionTokens
    {
        get;
        init;
    }

    /// <summary>Estimated USD savings vs synchronous pricing using <see cref="LlmBatchOptions.EstimatedDiscountRatio" />.</summary>
    public double EstimatedSavingsUsd
    {
        get;
        init;
    }

    public bool UsedSynchronousFallback
    {
        get;
        init;
    }
}
