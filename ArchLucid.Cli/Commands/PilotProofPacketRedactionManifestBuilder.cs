using System.Globalization;
using System.Text.Json;

using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>Buyer-safe redaction manifest for external proof-packet circulation.</summary>
public static class PilotProofPacketRedactionManifestBuilder
{
    public static string BuildJson(bool redactionPassApplied, string? outputDirectory = null)
    {
        string status = redactionPassApplied ? "PASS" : "NOT_APPLIED";
        string redactionStatus = redactionPassApplied ? "PASS" : "NOT_APPLIED";
        IReadOnlyList<BuyerSafeArtifactIntegrityEntry> fileIntegrity = [];

        if (!string.IsNullOrWhiteSpace(outputDirectory) && Directory.Exists(outputDirectory))
        {
            fileIntegrity = BuyerSafeArtifactIntegrityHasher.BuildEntries(
                outputDirectory,
                PilotProofPacketArtifactCatalog.CoreFileNames,
                redactionStatus);
        }

        Dictionary<string, object?> payload = new(StringComparer.Ordinal)
        {
            ["schema"] = PilotProofPacketArtifactCatalog.RedactionManifestSchema,
            ["formatVersion"] = "1.0",
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["status"] = status,
            ["redactionPassAppliedToProofPacket"] = redactionPassApplied,
            ["filesCovered"] = PilotProofPacketArtifactCatalog.CoreFileNames,
            ["fileIntegrity"] = fileIntegrity,
            ["omittedSecretBearingCategories"] = new[]
            {
                "raw API key values",
                "raw bearer tokens",
                "raw connection strings and shared access keys",
                "raw private key material",
                "raw long prompt or completion text",
            },
            ["secretDetectionStatus"] = redactionPassApplied
                ? "NOT_RECORDED_BY_DESIGN_BUYER_SAFE_EXPORT"
                : "NOT_SCANNED_REDACTION_PASS_NOT_APPLIED",
            ["evidenceClaim"] = redactionPassApplied
                ? "Proof-packet URLs and known secret patterns were passed through SupportBundleRedactor helpers before write."
                : "Proof-packet files were written without an explicit redaction pass.",
            ["limitations"] = new[]
            {
                "Pattern redaction is defense-in-depth — operators must still avoid capturing secrets upstream.",
                "Review externally supplied logs before sponsor circulation.",
            },
            ["reviewerInstructions"] = new[]
            {
                "Open redaction-manifest.json before external send and verify status is PASS.",
                "Cross-check limitations.md and quote-to-proof-readiness.json for HOLD items.",
            },
        };

        return JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
    }
}
