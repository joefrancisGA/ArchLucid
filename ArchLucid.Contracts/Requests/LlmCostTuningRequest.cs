namespace ArchLucid.Contracts.Requests;

/// <summary>Body for <c>POST /v1/admin/llm-cost-tuning</c> (SQL hosts).</summary>
public sealed class LlmCostTuningRequest
{
    /// <summary>USD per 1M prompt (input) tokens.</summary>
    public decimal InputUsdPerMillionTokens
    {
        get;
        set;
    }

    /// <summary>USD per 1M completion (output) tokens.</summary>
    public decimal OutputUsdPerMillionTokens
    {
        get;
        set;
    }
}
