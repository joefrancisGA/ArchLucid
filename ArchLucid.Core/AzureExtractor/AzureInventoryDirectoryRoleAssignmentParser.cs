using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public static class AzureInventoryDirectoryRoleAssignmentParser
{
    public static bool TryParse(JsonElement element, out AzureInventoryDirectoryRoleAssignmentRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Directory role assignment row must be a JSON object.";
            return false;
        }

        string? principalId = TryReadString(element, "principalId");
        string? roleDefinitionId = TryReadString(element, "roleDefinitionId");
        string? directoryScopeId = TryReadString(element, "directoryScopeId");

        if (string.IsNullOrWhiteSpace(principalId)
            || string.IsNullOrWhiteSpace(roleDefinitionId)
            || string.IsNullOrWhiteSpace(directoryScopeId))
        {
            errorMessage = "principalId, roleDefinitionId, and directoryScopeId are required.";
            return false;
        }

        ProvenanceKind provenanceKind = TryReadProvenanceKind(element) ?? ProvenanceKind.HumanAssertion;

        if (provenanceKind is not ProvenanceKind.ObservedFact and not ProvenanceKind.HumanAssertion)
        {
            errorMessage = "Directory role assignment provenance must be ObservedFact or HumanAssertion.";
            return false;
        }

        row = new AzureInventoryDirectoryRoleAssignmentRow
        {
            PrincipalId = principalId.Trim(),
            PrincipalType = TryReadString(element, "principalType"),
            RoleDefinitionId = roleDefinitionId.Trim(),
            RoleDefinitionTemplateId = TryReadString(element, "roleDefinitionTemplateId"),
            DirectoryScopeId = directoryScopeId.Trim(),
            RoleName = TryReadString(element, "roleName"),
            PimEligibilityKind = TryReadString(element, "pimEligibilityKind"),
            ProvenanceKind = provenanceKind,
            EvidenceHashSha256 = TryReadEvidenceHash(element)
                ?? ComputeDefaultEvidenceHash(principalId, roleDefinitionId, directoryScopeId),
        };

        return true;
    }

    public static byte[] ComputeDefaultEvidenceHash(string principalId, string roleDefinitionId, string directoryScopeId)
    {
        var payload = new
        {
            PrincipalId = principalId.Trim(),
            RoleDefinitionId = roleDefinitionId.Trim(),
            DirectoryScopeId = directoryScopeId.Trim(),
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
