using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Whether answering this elicitation question is mandatory before a draft may be submitted
///     (<see cref="Must" />) or advisory — improves confidence but does not block submission
///     (<see cref="Should" />).
/// </summary>
/// <remarks>
///     <see cref="Must" /> maps to the admission gate in ADR 0048: a draft transitions to
///     <c>Submitted</c> only when every <see cref="Must" /> question for the active pillars/packs
///     has been answered.  <see cref="Should" /> questions contribute to the 1–100 confidence
///     score per ADR 0050 but are never blocking.
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ElicitationQuestionTier
{
    /// <summary>Must be answered before the draft can be submitted.</summary>
    Must,

    /// <summary>Should be answered to increase scoring confidence, but is not blocking.</summary>
    Should,
}
