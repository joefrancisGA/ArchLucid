using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     A single item ArchLucid filled on the user's behalf during intake (ADR 0050 / R4).
/// </summary>
/// <remarks>
///     Appears in <see cref="TransparencyTrail.Inferred" />.  Each entry carries a
///     <see cref="Confidence" /> score (1–100) that lowers downstream trust when the inference
///     proves wrong.  Inferred actors from <see cref="ActorSet.InferredActors" /> map here.
/// </remarks>
public sealed class InferredTrailEntry
{
    public const string KeyNotStoredLabel = "Inferred trail key was not stored.";

    public const string KeyStoredEmptyLabel = "Inferred trail key was stored empty.";

    public const string ValueNotStoredLabel = "Inferred value was not stored.";

    public const string ValueStoredEmptyLabel = "Inferred value was stored empty.";

    public const string ConfidenceNotStoredLabel = "Confidence was not stored.";

    public static bool IsStoredConfidence(int confidence) => confidence is >= 1 and <= 100;

    public string FormatExportKeySegment()
    {
        if (Key is null)
        {
            return KeyNotStoredLabel;
        }

        string trimmed = Key.Trim();

        return trimmed.Length > 0 ? trimmed : KeyStoredEmptyLabel;
    }

    public string FormatExportValueSegment()
    {
        if (Value is null)
        {
            return ValueNotStoredLabel;
        }

        string trimmed = Value.Trim();

        return trimmed.Length > 0 ? trimmed : ValueStoredEmptyLabel;
    }

    public string FormatExportConfidenceSegment()
    {
        return IsStoredConfidence(Confidence)
            ? $"confidence {Confidence}"
            : ConfidenceNotStoredLabel;
    }

    public string FormatMarkdownExportLine()
    {
        return $"{FormatExportKeySegment()}: {FormatExportValueSegment()} ({FormatExportConfidenceSegment()})";
    }

    /// <summary>
    ///     Stable identifier for the inferred item (e.g. <c>actor.partner-webhook</c>,
    ///     <c>scale.requestsPerSecond</c>).
    /// </summary>
    [JsonPropertyName("key")]
    public string Key
    {
        get;
        set;
    } = string.Empty;

    /// <summary>The value ArchLucid inferred for <see cref="Key" />.</summary>
    [JsonPropertyName("value")]
    public string Value
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Confidence that this inference is correct (1 = very uncertain, 100 = high certainty).
    ///     Must be in the range 1–100 inclusive.
    /// </summary>
    [JsonPropertyName("confidence")]
    public int Confidence
    {
        get;
        set;
    }
}
