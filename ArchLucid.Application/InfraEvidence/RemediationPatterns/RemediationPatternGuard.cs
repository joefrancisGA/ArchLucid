using ArchLucid.Application.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

public static class RemediationPatternGuard
{
    public static bool TryValidateDraftRequest(
        RemediationPatternDraftRequest request,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.PatternKey))
        {
            errorMessage = "PatternKey is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            errorMessage = "DisplayName is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Version))
        {
            errorMessage = "Version is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(request.Content.ControlObjective))
        {
            errorMessage = "ControlObjective is required.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool CanTransition(
        RemediationPatternStatus current,
        RemediationPatternStatus next,
        out string? errorMessage)
    {
        bool allowed = (current, next) switch
        {
            (RemediationPatternStatus.Draft, RemediationPatternStatus.UnderReview) => true,
            (RemediationPatternStatus.UnderReview, RemediationPatternStatus.Approved) => true,
            (RemediationPatternStatus.Approved, RemediationPatternStatus.Deprecated) => true,
            (RemediationPatternStatus.Deprecated, RemediationPatternStatus.Retired) => true,
            (RemediationPatternStatus.Approved, RemediationPatternStatus.Retired) => true,
            (RemediationPatternStatus.Draft, RemediationPatternStatus.Retired) => true,
            (RemediationPatternStatus.UnderReview, RemediationPatternStatus.Retired) => true,
            _ => false,
        };

        if (!allowed)
        {
            errorMessage = $"Cannot transition remediation pattern from {current} to {next}.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool TryValidateApprovalSegregation(
        RemediationPatternVersionRecord version,
        string approverActorKey,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(version);
        ArgumentException.ThrowIfNullOrWhiteSpace(approverActorKey);

        if (string.Equals(version.AuthorActorKey, approverActorKey, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "Approver cannot be the same actor as the pattern author.";
            return false;
        }

        errorMessage = null;
        return true;
    }
}
