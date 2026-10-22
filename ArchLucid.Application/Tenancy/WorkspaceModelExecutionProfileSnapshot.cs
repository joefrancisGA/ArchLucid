using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Tenancy;

public sealed record WorkspaceModelExecutionProfileSnapshot(
    AgentModelExecutionProfile EffectiveProfile,
    WorkspaceModelExecutionProfileSource Source);
