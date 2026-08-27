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
        return IsUsableOptionalGuid(projectId);
    }

    /// <summary>
    ///     Returns whether <paramref name="value" /> is omitted or a non-empty GUID.
    /// </summary>
    public static bool IsUsableOptionalGuid(Guid? value)
    {
        return !value.HasValue || value.Value != Guid.Empty;
    }

    /// <summary>
    ///     Returns whether <paramref name="value" /> is a non-empty GUID.
    /// </summary>
    public static bool IsUsableRequiredGuid(Guid value)
    {
        return value != Guid.Empty;
    }
}
