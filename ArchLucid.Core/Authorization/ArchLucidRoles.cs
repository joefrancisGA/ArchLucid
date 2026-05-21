namespace ArchLucid.Core.Authorization;

/// <summary>
///     Role names carried on JWT <c>roles</c> / <see cref="System.Security.Claims.ClaimTypes.Role" /> claims and
///     DevelopmentBypass.
/// </summary>
public static class ArchLucidRoles
{
    /// <summary>
    ///     Read-only access (runs, manifests, governance reads, audit list/search). Claim value <c>Reader</c> matches
    ///     typical Entra app-role strings.
    /// </summary>
    public const string Reader = "Reader";

    /// <summary>Documentation alias for <see cref="Reader" /> (same claim value).</summary>
    public const string ReadOnly = Reader;

    public const string Operator = "Operator";

    /// <summary>Same HTTP capabilities as <see cref="Operator" />; IdP uses this label for architect personas (typically with <c>commit:run</c>).</summary>
    public const string Architect = "Architect";

    /// <summary>
    ///     Project-scoped admin overlay stored in <c>dbo.ProjectRoleAssignments</c> (not emitted by typical IdP JWT
    ///     role claims unless explicitly modeled).
    /// </summary>
    public const string ProjectAdmin = "ProjectAdmin";

    /// <summary>Operator-equivalent role without <c>commit:run</c> in <see cref="ArchLucid.Api.Auth.Services.ArchLucidRoleClaimsTransformation" />.</summary>
    public const string Reviewer = "Reviewer";

    /// <summary>Tenant/workspace governance persona; treated like <see cref="Admin" /> for policy until workspace-only admin is modeled.</summary>
    public const string WorkspaceAdmin = "WorkspaceAdmin";

    public const string Admin = "Admin";

    /// <summary>
    ///     Executive sponsor persona (read-oriented sponsor surfaces). Typical Entra app-role string <c>Sponsor</c>.
    /// </summary>
    public const string Sponsor = "Sponsor";

    /// <summary>
    ///     Internal platform operator (hosted / break-glass). Mapped to <c>platform:tenant-delete</c> permission for
    ///     tenant offboarding jobs — grant only via IdP or DevelopmentBypass <c>DevRole</c>.
    /// </summary>
    public const string PlatformOperator = "PlatformOperator";

    /// <summary>Read scope plus audit export and compliance-oriented audit access.</summary>
    public const string Auditor = "Auditor";
}
