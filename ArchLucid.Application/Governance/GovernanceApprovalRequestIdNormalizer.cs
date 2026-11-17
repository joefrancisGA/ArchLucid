using ArchLucid.Core.Authentication;

namespace ArchLucid.Application.Governance;

/// <summary>Normalizes governance approval request ids from HTTP bodies, routes, and batch payloads.</summary>
public static class GovernanceApprovalRequestIdNormalizer
{
    public static string Normalize(string approvalRequestId)
    {
        ArgumentNullException.ThrowIfNull(approvalRequestId);

        return ApiKeyMaterialNormalizer.Normalize(approvalRequestId).Trim();
    }
}
