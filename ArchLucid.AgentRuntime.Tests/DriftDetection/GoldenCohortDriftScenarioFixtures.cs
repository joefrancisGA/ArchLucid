using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

internal static class GoldenCohortDriftScenarioFixtures
{
    internal static AgentEvidencePackage BuildEvidence(string runId, ArchitectureRequest request)
    {
        return new AgentEvidencePackage
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence
            {
                Description = request.Description,
                Constraints = request.Constraints.ToList(),
                RequiredCapabilities = request.RequiredCapabilities.ToList(),
                Assumptions = request.Assumptions.ToList(),
            },
        };
    }

    /// <summary>Matches <see cref="GoldenCohortSimulatorDeterminismTests" /> task bundle.</summary>
    internal static List<AgentTask> BuildStandardQuad(string runId)
    {
        return
        [
            new AgentTask
            {
                TaskId = "task-topology",
                RunId = runId,
                AgentType = AgentType.Topology,
                Objective = "Propose topology.",
            },
            new AgentTask
            {
                TaskId = "task-cost",
                RunId = runId,
                AgentType = AgentType.Cost,
                Objective = "Estimate cost.",
            },
            new AgentTask
            {
                TaskId = "task-compliance",
                RunId = runId,
                AgentType = AgentType.Compliance,
                Objective = "Check compliance.",
            },
            new AgentTask
            {
                TaskId = "task-critic",
                RunId = runId,
                AgentType = AgentType.Critic,
                Objective = "Critique design.",
            },
        ];
    }
}
