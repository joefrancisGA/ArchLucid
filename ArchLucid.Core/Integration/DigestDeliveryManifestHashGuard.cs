using System.Text.Json;

using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Core.Integration;

/// <summary>Wave-22 suggestion 219: digest webhook delivery fail-closed when run-linked digest omits manifestHash metadata.</summary>
public static class DigestDeliveryManifestHashGuard
{
    public static void EnsureRunLinkedDigestManifestHashOrThrow(ArchitectureDigest digest)
    {
        ArgumentNullException.ThrowIfNull(digest);

        if (digest.RunId is null || digest.RunId == Guid.Empty)
            return;

        if (string.IsNullOrWhiteSpace(digest.MetadataJson))
        {
            throw new InvalidOperationException(
                $"Digest delivery blocked for digest '{digest.DigestId:D}': metadata must include manifestHash when RunId is set.");
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(digest.MetadataJson);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Digest delivery blocked for digest '{digest.DigestId:D}': metadata is not valid JSON.",
                ex);
        }

        using (document)
        {
            JsonElement root = document.RootElement;

            if (root.TryGetProperty("manifestHash", out JsonElement hashElement)
                && hashElement.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(hashElement.GetString()))
            {
                return;
            }

            throw new InvalidOperationException(
                $"Digest delivery blocked for digest '{digest.DigestId:D}': manifestHash metadata is required when RunId is set.");
        }
    }
}
