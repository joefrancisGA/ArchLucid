namespace ArchLucid.Core.Configuration.Summary;

public sealed class ModelAliasRegistryEntryResponse
{
    public string AliasId { get; set; } = string.Empty;

    public string ProviderConnectionKind { get; set; } = string.Empty;

    public IReadOnlyList<string> CapabilityTags { get; set; } = [];

    public IReadOnlyList<string> ApprovedTaskTypes { get; set; } = [];
}

public sealed class ModelGovernanceProfileAgentAliasMappingResponse
{
    public string AgentType { get; set; } = string.Empty;

    public string AliasId { get; set; } = string.Empty;
}

public sealed class ModelGovernanceProfileMappingResponse
{
    public string Profile { get; set; } = "Balanced";

    public IReadOnlyList<ModelGovernanceProfileAgentAliasMappingResponse> AgentAliasMappings { get; set; } = [];
}

public sealed class ModelGovernanceCatalogResponse
{
    public WorkspaceModelExecutionProfileResponse WorkspaceProfile { get; set; } = new();

    public IReadOnlyList<ModelAliasRegistryEntryResponse> RegistryEntries { get; set; } = [];

    public IReadOnlyList<ModelGovernanceProfileMappingResponse> ProfileMappings { get; set; } = [];
}
