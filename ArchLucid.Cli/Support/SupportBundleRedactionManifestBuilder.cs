using System.Globalization;

namespace ArchLucid.Cli.Support;

public static class SupportBundleRedactionManifestBuilder
{
    public static SupportBundleRedactionManifest Build(
        bool redactionPassAppliedToSerializedSections,
        string? outputDirectory = null)
    {
        string status = redactionPassAppliedToSerializedSections ? "PASS" : "NOT_APPLIED";
        string redactionStatus = redactionPassAppliedToSerializedSections ? "PASS" : "NOT_APPLIED";
        IReadOnlyList<string> filesCovered = SupportBundleFinalManifestBuilder.LexOrderedSectionFileNames();
        IReadOnlyList<BuyerSafeArtifactIntegrityEntry> fileIntegrity = [];

        if (!string.IsNullOrWhiteSpace(outputDirectory) && Directory.Exists(outputDirectory))
        {
            fileIntegrity = BuyerSafeArtifactIntegrityHasher.BuildEntries(
                outputDirectory,
                filesCovered,
                redactionStatus);
        }

        IReadOnlyList<string> rules = redactionPassAppliedToSerializedSections
            ? [.. SupportBundleRedactor.TextPatternRedactionRules]
            : [];

        return new SupportBundleRedactionManifest
        {
            GeneratedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            Status = status,
            RedactionPassAppliedToSerializedSections = redactionPassAppliedToSerializedSections,
            RulesApplied = rules,
            FilesCovered = filesCovered,
            FileIntegrity = fileIntegrity,
            OmittedSecretBearingCategories =
            [
                "raw API key values",
                "raw bearer tokens",
                "raw connection strings and shared access keys",
                "raw private key material",
                "raw long prompt or completion text"
            ],
            SecretDetectionStatus = redactionPassAppliedToSerializedSections
                ? "NOT_RECORDED_BY_DESIGN_PATTERN_REDACTION_APPLIED"
                : "NOT_SCANNED_REDACTION_PASS_NOT_APPLIED",
            EvidenceClaim = redactionPassAppliedToSerializedSections
                ? "Serialized support-bundle sections were passed through the ArchLucid text-pattern redactor before writing."
                : "Serialized support-bundle sections were written without the final text-pattern redaction pass.",
            Limitations =
            [
                "Pattern redaction is a defense-in-depth support control, not a substitute for avoiding secret capture upstream.",
                "Review externally supplied logs before sharing a bundle outside the operator or support team.",
                "Raw prompts, raw completions, credentials, and customer personal data should not be intentionally included in support evidence."
            ],
            ReviewerInstructions =
            [
                "Open manifest.json first to confirm redactionPassAppliedToSerializedSections is true for shared bundles.",
                "Open redaction-manifest.json before external circulation and verify status is PASS.",
                "Run the support-bundle redaction tests before changing redaction rules or bundle file inventory."
            ]
        };
    }
}
