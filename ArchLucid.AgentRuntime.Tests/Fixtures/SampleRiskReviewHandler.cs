using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime.Tests.Fixtures;

/// <summary>
///     Compile-safe custom handler fixture referenced from <c>docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md</c>.
///     Not registered in production composition; tests prove the handler contract only.
/// </summary>
public sealed class SampleRiskReviewHandler : IAgentHandler
{
    public AgentType AgentType => AgentType.Critic;

    public string AgentTypeKey => "sample-risk-review";

    public Task<AgentResult> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(task);

        AgentResult result = new()
        {
            RunId = runId,
            TaskId = task.TaskId,
            AgentType = AgentType,
            Claims = ["Sample custom handler completed without live LLM calls."],
            EvidenceRefs = [],
            Confidence = 0.5,
            Findings = [],
            ReasoningTrace = "Simulator-safe custom handler sample; no raw prompts or secrets logged.",
        };

        return Task.FromResult(result);
    }
}
