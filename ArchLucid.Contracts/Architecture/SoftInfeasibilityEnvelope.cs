using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Confidence band and operating envelope for <see cref="FeasibilityVerdictKind.SoftInfeasible" /> (ADR 0050 / R6).
/// </summary>
public sealed class SoftInfeasibilityEnvelope
{
    /// <summary>Lower bound of the confidence band (1–100).</summary>
    [JsonPropertyName("confidenceLow")]
    public int ConfidenceLow
    {
        get;
        set;
    }

    /// <summary>Upper bound of the confidence band (1–100); must be &gt;= <see cref="ConfidenceLow" />.</summary>
    [JsonPropertyName("confidenceHigh")]
    public int ConfidenceHigh
    {
        get;
        set;
    }

    /// <summary>
    ///     Where the design holds vs breaks (e.g. "feasible below 1k RPS, breaks above without partition tolerance").
    /// </summary>
    [JsonPropertyName("envelopeDescription")]
    public string EnvelopeDescription
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The empirical or economic assumption that makes the verdict soft rather than hard.</summary>
    [JsonPropertyName("softAssumption")]
    public string SoftAssumption
    {
        get;
        set;
    } = string.Empty;

    /// <summary>What it costs the operator if this soft verdict is wrong (time, money, reputational).</summary>
    [JsonPropertyName("costOfBeingWrong")]
    public string CostOfBeingWrong
    {
        get;
        set;
    } = string.Empty;
}
