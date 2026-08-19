using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Tenancy;

public sealed record TenantAgentOutputQualityGateModeSnapshot(
    AgentOutputQualityGateMode EffectiveMode,
    TenantAgentOutputQualityGateModeSource Source,
    AgentOutputQualityGateMode HostDefaultMode);
