using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Mandatory authority reference for a <see cref="FeasibilityVerdictKind.HardInfeasible" /> verdict (ADR 0050).
/// </summary>
public sealed class FeasibilityHardCitation
{
    [JsonPropertyName("kind")]
    public FeasibilityCitationKind Kind
    {
        get;
        set;
    }

    /// <summary>
    ///     Human-readable citation (law/theorem name) or short explanation of the contradiction.
    /// </summary>
    [JsonPropertyName("reference")]
    public string Reference
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     <c>INV-*</c> keys when <see cref="Kind" /> is
    ///     <see cref="FeasibilityCitationKind.InvariantContradiction" /> (at least two required).
    /// </summary>
    [JsonPropertyName("invariantKeys")]
    public List<string> InvariantKeys
    {
        get;
        set;
    } = [];
}
