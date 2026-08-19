using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>
/// Minimal structured context for workspace-scoped Ask when no single review is anchored (TB-2200).
/// </summary>
internal static class AskWorkspaceContextBuilder
{
    internal static string BuildContextJson(ScopeContext scope)
    {
        object context = new
        {
            scope = "workspace",
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            note =
                "No single review is anchored. Ground answers in retrieved evidence across workspace-indexed reviews.",
        };

        return JsonSerializer.Serialize(context, ContractJson.CamelCaseIgnoreNullCompact);
    }
}
