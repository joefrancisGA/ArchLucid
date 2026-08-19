namespace ArchLucid.Core.Configuration.Summary;

public sealed class WorkspaceAllowedEngineSetResponse
{
    public IReadOnlyList<string> AllowedAliasIds { get; set; } = [];

    public string DefaultAliasId { get; set; } = string.Empty;

    public string Source { get; set; } = "CatalogDefault";
}

public sealed class WorkspaceAllowedEngineSetUpdateRequest
{
    public IReadOnlyList<string> AllowedAliasIds { get; set; } = [];

    public string DefaultAliasId { get; set; } = string.Empty;
}

public sealed class ExternalSubprocessorEngineAcknowledgmentResponse
{
    public bool Acknowledged { get; set; }
}
