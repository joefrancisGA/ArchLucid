using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Governance;

/// <summary>Stable drift signal ids per scope + metric for escalation deduplication.</summary>
public static class ComplianceDriftEscalationSignalId
{
    public static Guid CreateForScopeMetric(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string metricKey)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(metricKey);

        string material = $"{tenantId:D}|{workspaceId:D}|{projectId:D}|{metricKey}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(material));
        Span<byte> guidBytes = stackalloc byte[16];
        hash.AsSpan(0, 16).CopyTo(guidBytes);
        guidBytes[6] = (byte)((guidBytes[6] & 0x0F) | 0x50);
        guidBytes[8] = (byte)((guidBytes[8] & 0x3F) | 0x80);

        return new Guid(guidBytes);
    }
}
