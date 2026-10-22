using ArchLucid.Contracts.Architecture;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.DiagramReconciliation;

/// <summary>Guards AI rationale: cannot promote InsufficientEvidence to Confirmed.</summary>
public static class DiagramInfrastructureMatchGuard
{
    public static bool TryApplyAiRationale(
        DiagramInfrastructureCorrespondenceRow row,
        string? proposedRationale,
        string proposedConfidenceBand,
        out string? rejectionReason)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (string.IsNullOrWhiteSpace(proposedRationale))
        {
            rejectionReason = null;
            return true;
        }

        if (string.Equals(row.ConfidenceBand, DiagramInfrastructureConfidenceBands.InsufficientEvidence, StringComparison.Ordinal)
            && string.Equals(proposedConfidenceBand, DiagramInfrastructureConfidenceBands.Confirmed, StringComparison.Ordinal))
        {
            rejectionReason = "AI rationale cannot promote InsufficientEvidence to Confirmed.";
            return false;
        }

        row.AiRationale = proposedRationale.Trim();

        if (!string.Equals(proposedConfidenceBand, row.ConfidenceBand, StringComparison.Ordinal)
            && !string.Equals(proposedConfidenceBand, DiagramInfrastructureConfidenceBands.InsufficientEvidence, StringComparison.Ordinal))
        {
            row.ConfidenceBand = proposedConfidenceBand;
        }

        rejectionReason = null;
        return true;
    }

    public static bool IsEligibleForAiRationale(string matchKind) =>
        matchKind is DiagramInfrastructureMatchKinds.Possible
            or DiagramInfrastructureMatchKinds.Unknown;
}
