namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Shared limits for governance environment slugs across catalog and workflow persistence.
/// </summary>
public static class GovernanceEnvironmentSlug
{
    /// <summary>
    ///     Maximum length for catalog slugs and workflow <c>SourceEnvironment</c> / <c>TargetEnvironment</c> columns.
    /// </summary>
    public const int MaxLength = 64;
}
