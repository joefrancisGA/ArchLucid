using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Architecture;

/// <summary>Builds <see cref="QuickScanGuardContext" /> values for Quick Scan routes.</summary>
public static class QuickScanGuardContextFactory
{
    public static QuickScanGuardContext Create(string clientIp, string sessionId, string description)
    {
        return new QuickScanGuardContext
        {
            ClientIp = clientIp,
            SessionId = sessionId,
            PayloadFingerprint = ComputeFingerprint(description, sessionId),
        };
    }

    public static string ComputeFingerprint(string description, string sessionId)
    {
        string payload = $"{sessionId}:{description.Trim().ToLowerInvariant()}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
