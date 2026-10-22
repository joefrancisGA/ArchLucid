using System.Text.Json;

using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>
///     Wave-19 suggestion 188: compute pre-receipt manifest hashes without mutating the live persisted document.
/// </summary>
internal static class ManifestDocumentHashScratch
{
    private static readonly JsonSerializerOptions CloneOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static ManifestDocument WithCommittedDecisionReceiptHashCleared(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        ManifestDocument scratch = JsonSerializer.Deserialize<ManifestDocument>(
                                   JsonSerializer.Serialize(manifest, CloneOptions),
                                   CloneOptions)
                               ?? throw new InvalidOperationException(
                                   "Failed to clone manifest document for hash computation.");

        scratch.CommittedDecisionReceiptHashSha256 = null;
        return scratch;
    }
}
