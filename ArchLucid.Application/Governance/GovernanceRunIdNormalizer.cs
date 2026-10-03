using ArchLucid.Core.Authentication;

namespace ArchLucid.Application.Governance;

/// <summary>Normalizes governance run ids from HTTP bodies, routes, and persisted approval rows.</summary>
public static class GovernanceRunIdNormalizer
{
    public static string Normalize(string runId)
    {
        ArgumentNullException.ThrowIfNull(runId);

        return ApiKeyMaterialNormalizer.Normalize(runId);
    }

    public static bool AreEquivalent(string left, string right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        if (Guid.TryParse(left, out Guid leftGuid) && Guid.TryParse(right, out Guid rightGuid))
            return leftGuid == rightGuid;

        return string.Equals(left, right, StringComparison.Ordinal);
    }
}
