namespace ArchLucid.Application.Tests.InfraEvidence.ReferenceAssurance;

/// <summary>
/// Azure-scope ancestry oracle used only by tests. String-prefix ancestry is intentionally simple and independent.
/// </summary>
internal static class ReferenceRbacScopeResolver
{
    internal static bool AppliesTo(string assignmentScope, string resourceId)
    {
        string assignment = Normalize(assignmentScope);
        string resource = Normalize(resourceId);

        if (assignment.Length == 0 || resource.Length == 0)
        {
            return false;
        }

        return resource.Equals(assignment, StringComparison.OrdinalIgnoreCase)
               || resource.StartsWith(assignment + "/", StringComparison.OrdinalIgnoreCase);
    }

    internal static IReadOnlySet<string> ResolveEffectiveScopes(
        IEnumerable<string> assignmentScopes,
        string resourceId) =>
        assignmentScopes
            .Where(scope => AppliesTo(scope, resourceId))
            .Select(Normalize)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

    private static string Normalize(string value) =>
        value.Trim().TrimEnd('/');
}
