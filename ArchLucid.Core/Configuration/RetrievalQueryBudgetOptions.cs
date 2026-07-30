namespace ArchLucid.Core.Configuration;

/// <summary>
///     Wall-clock and outbound network budgets for <c>GET /v1/retrieval/search</c> (embed → vector → rerank).
/// </summary>
/// <remarks>
///     The Next.js API proxy aborts upstream GETs at 60s. Without an API-side budget, a stalled Azure OpenAI
///     embedding or Azure AI Search call surfaces as proxy 502 "aborted due to timeout" while other API pages
///     remain healthy. Keep the overall budget under the proxy abort so the API can return a mapped 503 instead.
/// </remarks>
public sealed class RetrievalQueryBudgetOptions
{
    public const string SectionPath = "Retrieval:QueryBudget";

    /// <summary>
    ///     Overall wall-clock budget for one retrieval search (seconds). Clamped to 5–55.
    /// </summary>
    public int OverallTimeoutSeconds
    {
        get;
        set;
    } = 25;

    /// <summary>
    ///     Azure OpenAI embedding client <c>NetworkTimeout</c> (seconds). Clamped to 3–45.
    /// </summary>
    public int EmbeddingNetworkTimeoutSeconds
    {
        get;
        set;
    } = 15;

    /// <summary>
    ///     Azure AI Search client <c>Retry.NetworkTimeout</c> (seconds). Clamped to 3–45.
    /// </summary>
    public int SearchNetworkTimeoutSeconds
    {
        get;
        set;
    } = 15;

    public TimeSpan GetEffectiveOverallTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(OverallTimeoutSeconds, 5, 55));
    }

    public TimeSpan GetEffectiveEmbeddingNetworkTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(EmbeddingNetworkTimeoutSeconds, 3, 45));
    }

    public TimeSpan GetEffectiveSearchNetworkTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(SearchNetworkTimeoutSeconds, 3, 45));
    }
}
