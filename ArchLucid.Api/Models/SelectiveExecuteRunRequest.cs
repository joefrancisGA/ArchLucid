using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>TB-938 request body for selective agent re-execute.</summary>
[ExcludeFromCodeCoverage(Justification = "API request DTO; no business logic.")]
public sealed class SelectiveExecuteRunRequest
{
    public List<string>? TaskIds
    {
        get;
        set;
    }

    public List<string>? AgentTypes
    {
        get;
        set;
    }

    /// <summary>When true (default), upstream re-execute also invalidates Critic.</summary>
    public bool IncludeDependents
    {
        get;
        set;
    } = true;
}
