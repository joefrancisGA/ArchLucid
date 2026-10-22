using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Findings;

/// <summary>AS-058: consume existing Lane B faithfulness rows when composing Working support bands.</summary>
public interface IFindingSemanticSupportBandLaneBComposeService
{
    Task ApplyToAgentResultsAsync(
        string runId,
        ScopeContext scope,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default);
}
