using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class CloudResourceExplorerWorkQueueParser
{
    public static CloudResourceExplorerWorkQueue Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return CloudResourceExplorerWorkQueue.All;

        return raw.Trim().ToLowerInvariant() switch
        {
            "open-findings" => CloudResourceExplorerWorkQueue.OpenFindings,
            "open-remediation" => CloudResourceExplorerWorkQueue.OpenRemediation,
            "recent-drift" => CloudResourceExplorerWorkQueue.RecentDrift,
            _ => CloudResourceExplorerWorkQueue.All,
        };
    }
}
