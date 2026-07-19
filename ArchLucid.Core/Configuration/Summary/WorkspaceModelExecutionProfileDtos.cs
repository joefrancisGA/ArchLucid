namespace ArchLucid.Core.Configuration.Summary;

public sealed class WorkspaceModelExecutionProfileResponse
{
    public string EffectiveProfile { get; set; } = "Balanced";

    public string Source { get; set; } = "WorkspaceDefault";

    public string WorkspaceDefaultProfile { get; set; } = "Balanced";
}

public sealed class WorkspaceModelExecutionProfileUpdateRequest
{
    public string Profile { get; set; } = "Balanced";
}
