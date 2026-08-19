using System.Diagnostics;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Canonical OpenTelemetry Activity tag names and helpers for ADR 0053 correlation dimensions.
/// </summary>
public static class ActivityScopeTags
{
    public const string TenantIdTag = "archlucid.tenant_id";

    public const string WorkspaceIdTag = "archlucid.workspace_id";

    public const string EvidencePackageIdTag = "archlucid.evidence_package_id";

    /// <summary>
    ///     Sets tenant and workspace tags on <paramref name="activity" /> when scope GUIDs are present.
    /// </summary>
    public static void ApplyTenantWorkspace(Activity? activity, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (activity is null)
            return;

        if (TryFormatScopeGuid(scope.TenantId, out string tenantFormatted))
            activity.SetTag(TenantIdTag, tenantFormatted);

        if (TryFormatScopeGuid(scope.WorkspaceId, out string workspaceFormatted))
            activity.SetTag(WorkspaceIdTag, workspaceFormatted);
    }

    /// <summary>
    ///     Sets the evidence-package tag when <paramref name="evidencePackageId" /> is a non-empty GUID.
    /// </summary>
    public static void ApplyEvidencePackageId(Activity? activity, Guid evidencePackageId)
    {
        if (activity is null)
            return;

        if (!TryFormatScopeGuid(evidencePackageId, out string formatted))
            return;

        activity.SetTag(EvidencePackageIdTag, formatted);
    }

    private static bool TryFormatScopeGuid(Guid id, out string formatted)
    {
        if (id == Guid.Empty)
        {
            formatted = string.Empty;

            return false;
        }

        formatted = id.ToString("D");

        return true;
    }
}
