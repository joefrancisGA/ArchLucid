using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Formats agent topology proposal evidence refs to fit <c>TechnologyLedgerEntries.EvidenceRef NVARCHAR(200)</c>.
/// </summary>
public static class TechnologyLedgerAgentTopologyEvidenceRef
{
    /// <summary>Matches <c>269_TechnologyLedgerEntries.sql</c> column length.</summary>
    public const int MaxLength = 200;

    private const string Prefix = "agentTopologyProposal:";

    public static string Format(string proposalId, string stableSubKey)
    {
        string normalizedProposalId = string.IsNullOrWhiteSpace(proposalId) ? "unknown" : proposalId.Trim();
        string normalizedSubKey = string.IsNullOrWhiteSpace(stableSubKey) ? "unknown" : stableSubKey.Trim();

        string candidate = $"{Prefix}{normalizedProposalId}:{normalizedSubKey}";

        if (candidate.Length <= MaxLength)
            return candidate;

        string hashedSubKey = HashToHex(normalizedSubKey);
        candidate = $"{Prefix}{normalizedProposalId}:{hashedSubKey}";

        if (candidate.Length <= MaxLength)
            return candidate;

        string hashedProposalId = HashToHex(normalizedProposalId);
        candidate = $"{Prefix}{hashedProposalId}:{hashedSubKey}";

        if (candidate.Length <= MaxLength)
            return candidate;

        return $"{Prefix}{HashToHex($"{normalizedProposalId}:{normalizedSubKey}")}";
    }

    private static string HashToHex(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
