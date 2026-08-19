using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

/// <summary>Maps ArchLucid finding severity to Azure DevOps work-item priority (1 = highest).</summary>
public static class AzureBoardsPriorityMapper
{
    /// <summary>Returns <see langword="null"/> when informational findings must not create a work item.</summary>
    public static int? TryMapPriority(FindingSeverity severity) =>
        severity switch
        {
            FindingSeverity.Critical => 1,
            FindingSeverity.Error => 2,
            FindingSeverity.Warning => 3,
            FindingSeverity.Info => null,
            _ => null
        };
}
