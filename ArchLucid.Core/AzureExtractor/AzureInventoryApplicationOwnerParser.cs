using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public static class AzureInventoryApplicationOwnerParser
{
    public static bool TryParse(JsonElement element, out AzureInventoryApplicationOwnerRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Application owner row must be a JSON object.";
            return false;
        }

        string? appObjectId = TryReadString(element, "appObjectId");
        string? appId = TryReadString(element, "appId");
        string? ownerId = TryReadString(element, "ownerId");

        if (string.IsNullOrWhiteSpace(appObjectId)
            || string.IsNullOrWhiteSpace(appId)
            || string.IsNullOrWhiteSpace(ownerId))
        {
            errorMessage = "appObjectId, appId, and ownerId are required.";
            return false;
        }

        ProvenanceKind provenanceKind = TryReadProvenanceKind(element) ?? ProvenanceKind.HumanAssertion;

        if (provenanceKind is not ProvenanceKind.ObservedFact and not ProvenanceKind.HumanAssertion)
        {
            errorMessage = "Application owner provenance must be ObservedFact or HumanAssertion.";
            return false;
        }

        row = new AzureInventoryApplicationOwnerRow
        {
            AppObjectId = appObjectId.Trim(),
            AppId = appId.Trim(),
            OwnerId = ownerId.Trim(),
            ProvenanceKind = provenanceKind,
            EvidenceHashSha256 = TryReadEvidenceHash(element)
                ?? ComputeDefaultEvidenceHash(appObjectId, appId, ownerId),
        };

        return true;
    }

    public static byte[] ComputeDefaultEvidenceHash(string appObjectId, string appId, string ownerId)
    {
        var payload = new
        {
            AppObjectId = appObjectId.Trim(),
            AppId = appId.Trim(),
            OwnerId = ownerId.Trim(),
        };

        string json = JsonSerializer.Serialize(payload);
        return SHA256.HashData(Encoding.UTF8.GetBytes(json));
    }

    private static ProvenanceKind? TryReadProvenanceKind(JsonElement element)
    {
        string? value = TryReadString(element, "provenanceKind")
                        ?? TryReadString(element, "ProvenanceKind");

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return Enum.TryParse(value, ignoreCase: true, out ProvenanceKind parsed) ? parsed : null;
    }

    private static byte[]? TryReadEvidenceHash(JsonElement element)
    {
        string? hex = TryReadString(element, "evidenceHashSha256")
                      ?? TryReadString(element, "EvidenceHashSha256");

        if (string.IsNullOrWhiteSpace(hex))
        {
            return null;
        }

        try
        {
            return Convert.FromHexString(hex.Trim());
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
