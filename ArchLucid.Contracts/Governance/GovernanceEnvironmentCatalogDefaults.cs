namespace ArchLucid.Contracts.Governance;

/// <summary>Built-in dev → test → prod ladder used when no administrator catalog exists yet.</summary>
public static class GovernanceEnvironmentCatalogDefaults
{
    public static GovernanceEnvironmentCatalog Create()
    {
        return new GovernanceEnvironmentCatalog
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition
                {
                    Slug = GovernanceEnvironment.Dev,
                    DisplayName = "Development",
                    SortOrder = 0,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = GovernanceEnvironment.Test,
                    DisplayName = "Staging",
                    SortOrder = 1,
                    IsActive = true,
                },
                new GovernanceEnvironmentDefinition
                {
                    Slug = GovernanceEnvironment.Prod,
                    DisplayName = "Production",
                    SortOrder = 2,
                    IsActive = true,
                },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition
                {
                    SourceSlug = GovernanceEnvironment.Dev,
                    TargetSlug = GovernanceEnvironment.Test,
                },
                new GovernanceEnvironmentTransition
                {
                    SourceSlug = GovernanceEnvironment.Test,
                    TargetSlug = GovernanceEnvironment.Prod,
                },
            ],
        };
    }
}
