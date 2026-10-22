namespace ArchLucid.Core.Authorization;

/// <summary>Normalized role literals stored on <c>dbo.ProjectRoleAssignments.Role</c>.</summary>
public static class ProjectRoleAssignmentRole
{
    public const string Reader = "Reader";

    public const string Operator = "Operator";

    public const string ProjectAdmin = "ProjectAdmin";

    /// <summary>Maps persisted <paramref name="sqlRole" /> to an ordered effective rank (<see cref="ProjectScopedEffectiveRole"/>).</summary>
    public static ProjectScopedEffectiveRole ParseRank(string sqlRole)
    {
        if (string.IsNullOrWhiteSpace(sqlRole))
            return ProjectScopedEffectiveRole.None;

        if (string.Equals(sqlRole.Trim(), ProjectAdmin, StringComparison.OrdinalIgnoreCase))
            return ProjectScopedEffectiveRole.ProjectAdmin;

        if (string.Equals(sqlRole.Trim(), Operator, StringComparison.OrdinalIgnoreCase))
            return ProjectScopedEffectiveRole.Operator;

        if (string.Equals(sqlRole.Trim(), Reader, StringComparison.OrdinalIgnoreCase))
            return ProjectScopedEffectiveRole.Reader;

        return ProjectScopedEffectiveRole.None;
    }
}
