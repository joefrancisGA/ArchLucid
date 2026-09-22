using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

public static class AzureInventoryFederatedCredentialParser
{
    public static bool TryParse(JsonElement element, out AzureInventoryFederatedCredentialRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Federated credential row must be a JSON object.";
            return false;
        }

        string? issuer = TryReadString(element, "issuer");
        string? subject = TryReadString(element, "subject");
        string? principalId = TryReadString(element, "principalId");

        if (string.IsNullOrWhiteSpace(issuer)
            || string.IsNullOrWhiteSpace(subject)
            || string.IsNullOrWhiteSpace(principalId))
        {
            errorMessage = "issuer, subject, and principalId are required.";
            return false;
        }

        ProvenanceKind provenanceKind = TryReadProvenanceKind(element) ?? ProvenanceKind.HumanAssertion;

        if (provenanceKind is not ProvenanceKind.ObservedFact and not ProvenanceKind.HumanAssertion)
        {
            errorMessage = "Federated credential provenance must be ObservedFact or HumanAssertion.";
            return false;
        }

        row = new AzureInventoryFederatedCredentialRow
        {
            Issuer = issuer.Trim(),
            Subject = subject.Trim(),
            PrincipalId = principalId.Trim(),
            AppId = TryReadString(element, "appId"),
            ParentResourceId = TryReadString(element, "parentResourceId"),
            CredentialName = TryReadString(element, "credentialName"),
            ProvenanceKind = provenanceKind,
            EvidenceHashSha256 = TryReadEvidenceHash(element)
                ?? ComputeDefaultEvidenceHash(issuer, subject, principalId, TryReadString(element, "appId")),
        };

        return true;
    }

    public static byte[] ComputeDefaultEvidenceHash(
        string issuer,
        string subject,
        string principalId,
        string? appId)
    {
        var payload = new
        {
            Issuer = issuer.Trim(),
            Subject = subject.Trim(),
            PrincipalId = principalId.Trim(),
            AppId = appId?.Trim(),
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
