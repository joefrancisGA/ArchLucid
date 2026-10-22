using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     A trade-off ArchLucid proposes; the human operator must explicitly accept (ADR 0050).
/// </summary>
public sealed class ProposedRelaxation
{
    /// <summary>Catalog invariant the operator could relax (<c>INV-*</c> from ADR 0035).</summary>
    [JsonPropertyName("invariantKey")]
    public string InvariantKey
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Plain-language description of the trade-off if this invariant is relaxed.</summary>
    [JsonPropertyName("tradeOffDescription")]
    public string TradeOffDescription
    {
        get;
        set;
    } = string.Empty;
}
