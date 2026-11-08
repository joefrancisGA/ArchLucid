using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Resolves agent type on persisted <see cref="AgentResult" /> envelopes when the top-level field is missing
///     but findings still declare <see cref="ArchitectureFinding.SourceAgent" />.
/// </summary>
internal static class AgentResultEnvelopeAgentTypeResolver
{
    public static AgentType ResolveAgentType(AgentResult result)
    {
        if (result.AgentType != default)
            return result.AgentType;

        AgentType fromFindings = ResolveAgentTypeFromFindings(result.Findings);

        if (fromFindings != default)
            return fromFindings;

        return ResolveAgentTypeFromFindings(result.ChecklistCoverage);
    }

    public static void EnsureFindingSourceAgents(AgentResult result)
    {
        AgentType agentType = ResolveAgentType(result);

        if (agentType == default)
            return;

        if (result.AgentType == default)
            result.AgentType = agentType;

        EnsureFindingSourceAgents(result.Findings, agentType);
        EnsureFindingSourceAgents(result.ChecklistCoverage, agentType);
    }

    private static AgentType ResolveAgentTypeFromFindings(IReadOnlyList<ArchitectureFinding>? findings)
    {
        if (findings is null)
            return default;

        foreach (ArchitectureFinding finding in findings)
        {
            if (finding is null)
                continue;

            if (finding.SourceAgent != default)
                return finding.SourceAgent;
        }

        return default;
    }

    private static void EnsureFindingSourceAgents(
        IReadOnlyList<ArchitectureFinding>? findings,
        AgentType agentType)
    {
        if (findings is null)
            return;

        foreach (ArchitectureFinding finding in findings)
        {
            if (finding is null)
                continue;

            if (finding.SourceAgent == default)
                finding.SourceAgent = agentType;
        }
    }
}
