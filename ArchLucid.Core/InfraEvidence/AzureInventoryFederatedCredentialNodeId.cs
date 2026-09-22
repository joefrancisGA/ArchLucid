using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Stable node id for CI federated credentials referenced from inventory adapter rows (SA-19).</summary>
public static class AzureInventoryFederatedCredentialNodeId
{
    public const string Prefix = "federated-credential://";

    public static string Format(string issuer, string subject)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(issuer);
        ArgumentException.ThrowIfNullOrWhiteSpace(subject);

        string normalized = $"{issuer.Trim()}|{subject.Trim()}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));

        return Prefix + Convert.ToHexStringLower(hash);
    }
}
