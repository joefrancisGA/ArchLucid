using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

/// <summary>Buyer-safe structural execution mode labels for proof-packet artifacts (INV-002).</summary>
public static class PilotProofPacketStructuralExecutionModeFormatter
{
    public static string? TryResolveLabelFromDeltasJson(string deltasJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deltasJson);

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (!root.TryGetProperty("structuralExecutionMode", out JsonElement modeEl))
            return null;

        StructuralExecutionMode? mode = ParseWireMode(modeEl);

        if (mode is null)
            return null;

        return mode.Value.ToString();
    }

    public static string BuildSponsorCaveatLine(string? modeLabel)
    {
        if (string.IsNullOrWhiteSpace(modeLabel))
            return "**Execution mode not captured** — do not treat this packet as real-mode AI evidence until mode is labeled Real with PilotStrict satisfied.";

        return modeLabel switch
        {
            "Real" => "**Execution mode: Real** — live model path; still verify PilotStrict and limitations.md before sponsor send.",
            "Simulator" =>
                "**Execution mode: Simulator** — deterministic path only; **do not** present as real-mode AI evidence or billable model output.",
            "Fallback" =>
                "**Execution mode: Fallback** — real path was attempted but simulator substitution was recorded; treat numeric highlights conservatively.",
            "Mixed" =>
                "**Execution mode: Mixed** — some agent steps used deterministic substitution; review per-agent traces before sponsor send.",
            _ =>
                FormattableString.Invariant(
                    $"**Execution mode: {modeLabel}** — verify limitations.md and run-evidence.json before sponsor send."),
        };
    }

    private static StructuralExecutionMode? ParseWireMode(JsonElement modeEl)
    {
        if (modeEl.ValueKind == JsonValueKind.String
            && Enum.TryParse(modeEl.GetString(), ignoreCase: true, out StructuralExecutionMode parsedFromString))
        {
            return parsedFromString;
        }

        if (modeEl.ValueKind == JsonValueKind.Number && modeEl.TryGetInt32(out int modeInt)
            && Enum.IsDefined(typeof(StructuralExecutionMode), modeInt))
        {
            return (StructuralExecutionMode)modeInt;
        }

        return null;
    }
}
