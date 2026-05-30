namespace ArchLucid.Contracts.Billing;

/// <summary>Estimated LLM spend for one architecture review run (assessment #14).</summary>
public sealed class LlmCostTopRunRowResponse
{
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public decimal EstimatedCostUsd
    {
        get;
        init;
    }

    public long PromptTokens
    {
        get;
        init;
    }

    public long CompletionTokens
    {
        get;
        init;
    }

    public int LlmCallCount
    {
        get;
        init;
    }
}
