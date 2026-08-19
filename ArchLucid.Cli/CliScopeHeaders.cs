using System.Net.Http.Headers;

namespace ArchLucid.Cli;

/// <summary>
/// Applies tenant/workspace/project scope headers from <c>archlucid.json</c> and well-known environment variables.
/// </summary>
internal static class CliScopeHeaders
{
    internal const string TenantHeader = "X-Tenant-Id";
    internal const string WorkspaceHeader = "X-Workspace-Id";
    internal const string ProjectHeader = "X-Project-Id";

    internal static void Apply(HttpClient http, ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        ArgumentNullException.ThrowIfNull(http);

        string? tenantId = Resolve(config?.Scope?.TenantId, "ARCHLUCID_TENANT_ID", "X_TENANT_ID");
        string? workspaceId = Resolve(config?.Scope?.WorkspaceId, "ARCHLUCID_WORKSPACE_ID", "X_WORKSPACE_ID");
        string? projectId = Resolve(config?.Scope?.ProjectId, "ARCHLUCID_PROJECT_ID", "X_PROJECT_ID");

        ApplyExplicit(http, tenantId, workspaceId, projectId);
    }

    internal static void ApplyExplicit(HttpClient http, string? tenantId, string? workspaceId, string? projectId)
    {
        ArgumentNullException.ThrowIfNull(http);

        SetHeader(http, TenantHeader, tenantId);
        SetHeader(http, WorkspaceHeader, workspaceId);
        SetHeader(http, ProjectHeader, projectId);
    }

    private static string? Resolve(string? fromConfig, params string[] envNames)
    {
        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig.Trim();

        foreach (string envName in envNames)
        {
            string? value = Environment.GetEnvironmentVariable(envName);

            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return null;
    }

    private static void SetHeader(HttpClient http, string name, string? value)
    {
        http.DefaultRequestHeaders.Remove(name);

        if (string.IsNullOrWhiteSpace(value))
            return;

        http.DefaultRequestHeaders.TryAddWithoutValidation(name, value);
    }
}
