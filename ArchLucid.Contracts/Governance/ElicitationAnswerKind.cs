using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>The data type expected for the user's answer to an elicitation question.</summary>
/// <remarks>
///     Used by the question-selection engine (ADR 0051) and UI to render the appropriate
///     input control and to validate/parse the answer before storing it on the draft.
/// </remarks>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ElicitationAnswerKind
{
    /// <summary>Free-form text (single-line or multi-line).</summary>
    Text,

    /// <summary>Boolean yes/no choice.</summary>
    Bool,

    /// <summary>Numeric value (integer or decimal).</summary>
    Number,

    /// <summary>One value from a bounded set; the allowed values are supplied out-of-band by the pack.</summary>
    Enum,
}
