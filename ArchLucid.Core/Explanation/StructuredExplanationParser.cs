using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.Explanation;

/// <summary>
///     Parses LLM output into <see cref="StructuredExplanation" />; never throws. Non-JSON or invalid payloads become a
///     fallback envelope.
/// </summary>
public static partial class StructuredExplanationParser
{
    /// <summary>
    ///     Returns <see langword="true" /> when <paramref name="rawText" /> is JSON that deserializes to a non-empty
    ///     <c>reasoning</c> field.
    /// </summary>
    public static bool TryNormalizeStructuredJson(
        string? rawText,
        [NotNullWhen(true)] out StructuredExplanation? structured)
    {
        structured = null;

        if (string.IsNullOrWhiteSpace(rawText))
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(rawText.Trim());
            JsonElement root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                return false;

            if (!RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "reasoning", out JsonElement reasoningElement))
            {
                return false;
            }

            string? reasoning = TryReadReasoningText(reasoningElement);

            if (string.IsNullOrWhiteSpace(reasoning))
                return false;

            int schemaVersion = 1;

            if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "schemaVersion", out JsonElement schemaElement)
                && StrictSchemaVersionReader.TryReadSchemaVersion(schemaElement, out int parsedSchemaVersion)
                && parsedSchemaVersion > 0)
            {
                schemaVersion = parsedSchemaVersion;
            }

            decimal? confidence = null;

            if (RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive(root, "confidence", out JsonElement confidenceElement))
            {
                double? finiteConfidence = RunExplanationAggregateJsonReader.TryReadFiniteDouble(confidenceElement);

                if (finiteConfidence is { } numericConfidence)
                    confidence = ClampConfidence((decimal)numericConfidence);
            }

            structured = new StructuredExplanation
            {
                SchemaVersion = schemaVersion,
                Reasoning = reasoning.Trim(),
                EvidenceRefs = TryReadStringList(root, "evidenceRefs") ?? [],
                Confidence = confidence,
                AlternativesConsidered = TryReadStringList(root, "alternativesConsidered"),
                Caveats = TryReadStringList(root, "caveats"),
            };

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    ///     Produces a <see cref="StructuredExplanation" /> from LLM output. On failure, returns an envelope with
    ///     <see cref="StructuredExplanation.Reasoning" /> set to the trimmed raw text (may be empty).
    /// </summary>
    public static StructuredExplanation Parse(string? rawText)
    {
        if (TryNormalizeStructuredJson(rawText, out StructuredExplanation? normalized))
            return normalized;

        return new StructuredExplanation
        {
            Reasoning = rawText?.Trim() ?? string.Empty,
            SchemaVersion = 1,
            EvidenceRefs = [],
            Confidence = null,
            AlternativesConsidered = null,
            Caveats = null
        };
    }

    /// <summary>
    ///     Normalizes LLM confidence to <c>[0, 1]</c>: values in <c>(1, 100]</c> are treated as percentages;
    ///     values outside <c>[0, 100]</c> are discarded.
    /// </summary>
    internal static decimal? ClampConfidence(decimal? value)
    {
        if (value is null)
            return null;

        decimal v = value.Value;

        if (v < 0m || v > 100m)
            return null;

        if (v > 1m)
            return v / 100m;

        return v;
    }
}
