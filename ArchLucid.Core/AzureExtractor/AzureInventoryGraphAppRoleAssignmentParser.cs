using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public static class AzureInventoryGraphAppRoleAssignmentParser
{
    public static bool TryParse(JsonElement element, out AzureInventoryGraphAppRoleAssignmentRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Graph app role assignment row must be a JSON object.";
            return false;
        }

        if (AzureInventoryEntraApplicationRegistrationParser.TryParse(element, out _, out _))
        {
            errorMessage = "Row is an application registration join, not an app role assignment.";
            return false;
        }

        string? principalId = TryReadString(element, "principalId");
        string? resourceId = TryReadString(element, "resourceId");
        string? appRoleId = TryReadString(element, "appRoleId");

        if (string.IsNullOrWhiteSpace(principalId)
            || string.IsNullOrWhiteSpace(resourceId)
            || string.IsNullOrWhiteSpace(appRoleId))
        {
            errorMessage = "principalId, resourceId, and appRoleId are required.";
            return false;
        }

        ProvenanceKind provenanceKind = TryReadProvenanceKind(element) ?? ProvenanceKind.HumanAssertion;

        if (provenanceKind is not ProvenanceKind.ObservedFact and not ProvenanceKind.HumanAssertion)
        {
            errorMessage = "Graph app role assignment provenance must be ObservedFact or HumanAssertion.";
            return false;
        }

        row = new AzureInventoryGraphAppRoleAssignmentRow
        {
            PrincipalId = principalId.Trim(),
            ResourceId = resourceId.Trim(),
            AppRoleId = appRoleId.Trim(),
            ProvenanceKind = provenanceKind,
            EvidenceHashSha256 = TryReadEvidenceHash(element)
                ?? ComputeDefaultEvidenceHash(principalId, resourceId, appRoleId),
        };

        return true;
    }

    public static byte[] ComputeDefaultEvidenceHash(string principalId, string resourceId, string appRoleId)
    {
        var payload = new
        {
            PrincipalId = principalId.Trim(),
            ResourceId = resourceId.Trim(),
            AppRoleId = appRoleId.Trim(),
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
