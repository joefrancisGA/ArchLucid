using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Analytics;

/// <summary>Stable opaque tenant surrogate for internal BI rollups (never reversible without salt).</summary>
public interface IAnalyticsTenantKeyDeriver
{
    string DeriveAnalyticsTenantKey(Guid tenantId);
}

/// <inheritdoc />
public sealed class AnalyticsTenantKeyDeriver : IAnalyticsTenantKeyDeriver
{
    private readonly byte[] _saltBytes;

    public AnalyticsTenantKeyDeriver(string pseudonymizationSalt)
    {
        if (string.IsNullOrWhiteSpace(pseudonymizationSalt))
            throw new ArgumentException("Pseudonymization salt is required.", nameof(pseudonymizationSalt));

        _saltBytes = Encoding.UTF8.GetBytes(pseudonymizationSalt);
    }

    /// <inheritdoc />
    public string DeriveAnalyticsTenantKey(Guid tenantId)
    {
        byte[] message = Encoding.UTF8.GetBytes(tenantId.ToString("D"));
        byte[] hash = HMACSHA256.HashData(_saltBytes, message);

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
