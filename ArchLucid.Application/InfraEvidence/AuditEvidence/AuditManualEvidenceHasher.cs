using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditManualEvidenceHasher
{
    public static byte[] ComputeContentHash(string content)
    {
        ArgumentNullException.ThrowIfNull(content);

        return SHA256.HashData(Encoding.UTF8.GetBytes(content));
    }
}
