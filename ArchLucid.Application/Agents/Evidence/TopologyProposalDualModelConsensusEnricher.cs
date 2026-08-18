using System.Text.Json;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Agents.Evidence;

public sealed class TopologyProposalDualModelConsensusEnricher(
    ITopologyProposalSecondaryCompletionInvoker secondaryCompletionInvoker,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    IOptions<TopologyProposalConsensusOptions> options,
    ILogger<TopologyProposalDualModelConsensusEnricher> logger) : IAgentResultPostExecutionEnricher
{
    private readonly ITopologyProposalSecondaryCompletionInvoker _secondaryCompletionInvoker =
        secondaryCompletionInvoker ?? throw new ArgumentNullException(nameof(secondaryCompletionInvoker));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TopologyProposalConsensusOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<TopologyProposalDualModelConsensusEnricher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task EnrichAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(results);

        if (!_options.Enabled)
            return;

        AgentResult? topologyResult = results.FirstOrDefault(static result => result.AgentType is AgentType.Topology);

        if (topologyResult is null || topologyResult.ProposedChanges is not AgentTopologyProposal primaryProposal)
            return;

        AgentTask topologyTask = new()
        {
            TaskId = topologyResult.TaskId,
            RunId = topologyResult.RunId,
            AgentType = AgentType.Topology,
            Objective = "Topology dual-model consensus secondary pass",
            ModelTierOverride = _options.SecondaryModelTier,
        };

        AgentTopologyProposal? secondaryProposal = await _secondaryCompletionInvoker.InvokeSecondaryAsync(
            runId,
            request,
            evidence,
            topologyTask,
            cancellationToken);

        if (secondaryProposal is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    "Topology dual-model consensus skipped for RunId={RunId}: secondary model returned no proposal.",
                    runId);

            return;
        }

        TopologyProposalConsensusMergeResult mergeResult =
            TopologyProposalConsensusMerger.Merge(primaryProposal, secondaryProposal);

        topologyResult.ProposedChanges = mergeResult.MergedProposal;

        if (mergeResult.DisagreementCount > 0)
        {
            topologyResult.Confidence *= _options.DisagreementConfidenceMultiplier;

            if (topologyResult.CalibratedConfidence is double calibrated)
                topologyResult.CalibratedConfidence = calibrated * _options.DisagreementConfidenceMultiplier;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid parsedRunId) ? parsedRunId : null;

        await _auditService.LogAsync(
            new AuditEvent
            {
                OccurredUtc = TimeProvider.System.UtcNowDateTime(),
                EventType = AuditEventTypes.Agent.TopologyProposalConsensusEvaluated,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    disagreementCount = mergeResult.DisagreementCount,
                    secondaryModelTier = _options.SecondaryModelTier.ToString(),
                    intersectionServices = mergeResult.MergedProposal.AddedServices.Count,
                    intersectionDatastores = mergeResult.MergedProposal.AddedDatastores.Count,
                    intersectionRelationships = mergeResult.MergedProposal.AddedRelationships.Count,
                }),
            },
            cancellationToken);
    }
}
