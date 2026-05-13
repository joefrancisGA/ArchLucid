namespace ArchLucid.Core.Authorization;

/// <summary>Authorization capability evaluated by tenant JWT roles and optional project overlays.</summary>
public enum TenantOrProjectCapabilityMode
{
    /// <summary>Reader-or-higher via tenant JWT role or project <c>Reader</c> assignment.</summary>
    Read = 0,

    /// <summary>Operator-tier via tenant JWT role or project <c>Operator</c>/<c>ProjectAdmin</c> assignments.</summary>
    Execute = 1,

    /// <summary>Tenant/workspace admin personas only (<see cref="ArchLucidRoles.Admin" />, <see cref="ArchLucidRoles.WorkspaceAdmin"/>).</summary>
    TenantAdminOnly = 2,

    /// <summary>Tenant/workspace admin OR <c>ProjectAdmin</c> assignment for ambient project scope.</summary>
    PolicyPackMutation = 3,

    /// <summary>Tenant JWT <c>commit:run</c> permission claim OR project operator / project-admin assignment.</summary>
    CommitRun = 4,

    /// <summary>
    ///     Operator-style surface that excludes canonical <see cref="ArchLucidRoles.Reader" /> at tenant JWT layer and
    ///     excludes <see cref="ArchLucidRoles.Reviewer" /> (imports / deterministic operator-only routes).
    /// </summary>
    ArchitectureDefinitionImport = 5
}
