using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class PilotProofPacketEnvironmentBuilder
{
    internal static string BuildJson(
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        string apiBaseRedacted,
        string deltasJson,
        bool demoWarning,
        bool pilotStrictSatisfied)
    {
        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        string? structuralMode = null;

        if (root.TryGetProperty("structuralExecutionMode", out JsonElement modeEl))
        {
            structuralMode = modeEl.ValueKind switch
            {
                JsonValueKind.String => modeEl.GetString(),
                JsonValueKind.Number when modeEl.TryGetInt32(out int modeInt) => modeInt.ToString(CultureInfo.InvariantCulture),
                _ => null,
            };
        }

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = "archlucid.proof-packet.environment.v1",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["apiBaseUrlRedacted"] = Support.SupportBundleRedactor.RedactHttpUrl(apiBaseRedacted),
            ["storageProviderSummary"] = "(see config-summary in support bundle — not duplicated here)",
            ["demoDataWarning"] = demoWarning,
            ["sponsorHandoffRecommended"] = pilotStrictSatisfied && !demoWarning,
            ["nextAction"] = pilotStrictSatisfied ? "PASS" : "HOLD",
            ["structuralExecutionMode"] = structuralMode ?? "(not captured)",
            ["skippedGates"] = "See limitations.md and first-pilot proof rollup for environment-wide gates not exercised by this run.",
        };

        return JsonSerializer.Serialize(payload, BuyerPacketFolderWriter.JsonWriteIndented);
    }
}
