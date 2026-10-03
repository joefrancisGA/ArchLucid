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
}
