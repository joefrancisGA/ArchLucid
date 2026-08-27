namespace ArchLucid.Api.Validators;

/// <summary>
///     Shared predicates for governance query-parameter validation.
/// </summary>
public static class GovernanceQueryRequestValidationRules
{
    /// <summary>
    ///     Returns whether <paramref name="projectId" /> is omitted or a non-empty GUID.
    /// </summary>
    public static bool IsUsableProjectId(Guid? projectId)
    {
        return !projectId.HasValue || projectId.Value != Guid.Empty;
    }
}
