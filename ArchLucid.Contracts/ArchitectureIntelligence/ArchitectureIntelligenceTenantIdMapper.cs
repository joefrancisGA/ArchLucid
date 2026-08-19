using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public static class ArchitectureIntelligenceTenantIdMapper
{
    public static Guid ToStorageGuid(string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(tenantId));
        }

        if (Guid.TryParse(tenantId, out Guid parsed))
        {
            return parsed;
        }

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(tenantId.Trim()));
        byte[] guidBytes = new byte[16];
        Array.Copy(hash, guidBytes, 16);

        return new Guid(guidBytes);
    }

    public static Guid ToStorageGuidOrEmpty(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Guid.Empty;
        }

        return ToStorageGuid(value);
    }
}
