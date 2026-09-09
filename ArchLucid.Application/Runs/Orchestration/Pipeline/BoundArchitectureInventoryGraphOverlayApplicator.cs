using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     AS-050: merges bound architecture inventory snapshot resources into the authority graph as ObservedFact overlay.
/// </summary>
public sealed class BoundArchitectureInventoryGraphOverlayApplicator(
    IArchitectureInventoryBindingRepository bindingRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    ILogger<BoundArchitectureInventoryGraphOverlayApplicator> logger) : IBoundArchitectureInventoryGraphOverlayApplicator
{
    private readonly IArchitectureInventoryBindingRepository _bindingRepository =
        bindingRepository ?? throw new ArgumentNullException(nameof(bindingRepository));

    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    private readonly ILogger<BoundArchitectureInventoryGraphOverlayApplicator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<GraphSnapshot> ApplyAsync(
        ScopeContext scope,
        RunRecord run,
        GraphSnapshot graphSnapshot,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (!run.ArchitectureId.HasValue || run.ArchitectureId.Value == Guid.Empty)
        {
            return graphSnapshot;
        }

        ArchitectureInventoryBindingRecord? binding = await _bindingRepository.TryGetByArchitectureIdAsync(
            scope,
            run.ArchitectureId.Value,
            cancellationToken);

        if (binding is null)
        {
            return graphSnapshot;
        }

        AzureInventorySnapshotDetailReadModel? snapshot = await _snapshotRepository.TryGetSnapshotDetailAsync(
            scope,
            binding.SnapshotId,
            cancellationToken);

        if (snapshot is null || snapshot.Resources.Count == 0)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Skipping inventory ObservedFact overlay for RunId={RunId}: snapshot {SnapshotId} is not readable.",
                    run.RunId,
                    binding.SnapshotId);
            }

            return graphSnapshot;
        }

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            run.RunId,
            graphSnapshot.ContextSnapshotId);

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(graphSnapshot, overlay);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Applied inventory ObservedFact overlay for RunId={RunId}, ArchitectureId={ArchitectureId}, SnapshotId={SnapshotId}, AddedNodes={AddedNodes}",
                run.RunId,
                run.ArchitectureId,
                binding.SnapshotId,
                merged.Nodes.Count - graphSnapshot.Nodes.Count);
        }

        return merged;
    }
}
