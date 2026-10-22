namespace ArchLucid.Core.Scoping;

public static class ProjectScopeKeyMapping
{
    public static ProjectScopeKey ToProjectScopeKey(this ScopeContext scope) =>
        ProjectScopeKey.From(scope);
}
