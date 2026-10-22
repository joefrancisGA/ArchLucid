using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Stable per-dimension check key for <see cref="Contracts.Findings.Finding.PolicyRuleId" /> joins across runs.
/// </summary>
internal static class ArchitectureIntelligenceStableCheckKey
{
    internal static string FromFinding(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string dimension = finding.Dimension.ToString();
        string title = finding.Title?.Trim() ?? string.Empty;
        string related = string.Join(
            ',',
            finding.RelatedModelElementIds.OrderBy(static id => id, StringComparer.OrdinalIgnoreCase));

        string canonical = string.Join('\u001f', dimension, title, related);
        byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));

        return Convert.ToHexString(digest.AsSpan(0, 8)).ToLowerInvariant();
    }
}
