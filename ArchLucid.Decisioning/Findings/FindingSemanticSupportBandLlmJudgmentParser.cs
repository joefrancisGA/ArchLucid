using System.Text.Json;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Parses the ADR 0099 finalize LLM judge JSON envelope. Unknown or empty payloads return null.</summary>
public static class FindingSemanticSupportBandLlmJudgmentParser
{
    public static FindingSemanticSupportBand? TryParse(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
            return null;

        try
        {
            using JsonDocument document = JsonDocument.Parse(rawJson);

            if (!document.RootElement.TryGetProperty("band", out JsonElement bandElement))
                return null;

            string? bandText = bandElement.GetString();

            if (string.IsNullOrWhiteSpace(bandText))
                return null;

            if (Enum.TryParse(bandText.Trim(), ignoreCase: true, out FindingSemanticSupportBand band)
                && band is FindingSemanticSupportBand.Supported
                    or FindingSemanticSupportBand.Unchecked
                    or FindingSemanticSupportBand.Unsupported)
            {
                return band;
            }

            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
