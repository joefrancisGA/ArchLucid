using ArchiForge.Application.Evidence;
using ArchiForge.AgentSimulator.Services;
using ArchiForge.Contracts.Requests;
using ArchiForge.Coordinator.Services;
using ArchiForge.DecisionEngine.Services;

namespace ArchiForge.Application;

public sealed class ArchitectureRunOrchestrator
{
    private readonly ICoordinatorService _coordinator;
    private readonly IAgentExecutor _agentExecutor;
    private readonly IDecisionEngineService _decisionEngine;
    private readonly IEvidenceBuilder _evidenceBuilder;

    public ArchitectureRunOrchestrator(
        ICoordinatorService coordinator,
        IAgentExecutor agentExecutor,
        IDecisionEngineService decisionEngine,
        IEvidenceBuilder evidenceBuilder)
    {
        _coordinator = coordinator;
        _agentExecutor = agentExecutor;
        _decisionEngine = decisionEngine;
        _evidenceBuilder = evidenceBuilder;
    }

    public async Task<DecisionMergeResult> ExecuteAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        var coordination = _coordinator.CreateRun(request);

        if (!coordination.Success)
        {
            throw new InvalidOperationException(
                $"Coordination failed: {string.Join("; ", coordination.Errors)}");
        }

        var evidence = await _evidenceBuilder.BuildAsync(
            coordination.Run.RunId,
            request,
            cancellationToken);

        var results = await _agentExecutor.ExecuteAsync(
            coordination.Run.RunId,
            request,
            evidence,
            coordination.Tasks,
            cancellationToken);

        return _decisionEngine.MergeResults(
            coordination.Run.RunId,
            request,
            "v1",
            results);
    }
}
