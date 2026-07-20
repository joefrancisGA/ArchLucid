using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Agents;

public sealed record ModelExecutionProfileResolution(
    AgentModelExecutionProfile EffectiveProfile,
    AgentModelExecutionProfile WorkspaceDefault,
    string? RequestedOverrideRaw,
    bool OverrideRejected);
