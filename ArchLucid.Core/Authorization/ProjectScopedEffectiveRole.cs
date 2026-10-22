namespace ArchLucid.Core.Authorization;

/// <summary>Highest matched project-role overlay for SCIM-linked users (<see cref="ProjectRoleAssignmentRole"/> strings in SQL).</summary>
public enum ProjectScopedEffectiveRole
{
    None = 0,
    Reader = 1,
    Operator = 2,
    ProjectAdmin = 3
}
