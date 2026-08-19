using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Deterministic recommendation identity: identical finding identity, proposed-change text, and dimension
///     yield the same <c>RecommendationId</c> (chapter 75 F7 / EK-03).
/// </summary>
internal static class ArchitectureRecommendationStableId
{
    internal static string FromFinding(SpecialistReviewFinding finding, string proposedChange)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(proposedChange);

        string findingId = finding.FindingId ?? string.Empty;
        string title = finding.Title ?? string.Empty;
        string dimension = finding.Dimension.ToString();
        string canonical = string.Join('\u001f', findingId, title, proposedChange, dimension);
        byte[] digest = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        // First 16 bytes of SHA-256 as Guid "N" — a guid-shaped digest of the canonical tuple, not an RFC 4122 UUID.
        return new Guid(digest.AsSpan(0, 16)).ToString("N");
    }
}
