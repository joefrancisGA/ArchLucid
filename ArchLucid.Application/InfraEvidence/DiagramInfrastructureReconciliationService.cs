using System.Text.Json;

using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class DiagramInfrastructureReconciliationService : IDiagramInfrastructureReconciliationService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly IStructuredDiagramIngestService diagramIngestService;
    private readonly IAzureInventorySnapshotRepository snapshotRepository;
    private readonly IArchitectureDiagramReconciliationRepository reconciliationRepository;

    public DiagramInfrastructureReconciliationService(
        IStructuredDiagramIngestService diagramIngestService,
        IAzureInventorySnapshotRepository snapshotRepository,
        IArchitectureDiagramReconciliationRepository reconciliationRepository)
    {
        this.diagramIngestService = diagramIngestService;
        this.snapshotRepository = snapshotRepository;
        this.reconciliationRepository = reconciliationRepository;
    }

    public async Task<DiagramInfrastructureReconciliationResult> ReconcileAsync(
        ScopeContext scope,
        Guid runId,
        DiagramInfrastructureReconciliationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (request.SnapshotId == Guid.Empty)
        {
            throw new ArgumentException("SnapshotId is required.", nameof(request));
        }

        ArchitectureDiagramModelRecord? diagram = await this.diagramIngestService.TryGetModelAsync(
            scope,
            runId,
            cancellationToken);

        if (diagram is null)
        {
            throw new InvalidOperationException("Architecture diagram model was not found for the run.");
        }

        AzureInventorySnapshotDetailReadModel? snapshot = await this.snapshotRepository.TryGetSnapshotDetailAsync(
            scope,
            request.SnapshotId,
            cancellationToken);

        if (snapshot is null)
        {
            throw new InvalidOperationException("Azure inventory snapshot was not found in the current scope.");
        }

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            runId,
            request.SnapshotId);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        string resultJson = JsonSerializer.Serialize(result, JsonOptions);

        await this.reconciliationRepository.UpsertAsync(
            new ArchitectureDiagramReconciliationPersistRecord
            {
                ReconciliationId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                RunId = runId,
                SnapshotId = request.SnapshotId,
                ResultJson = resultJson,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            cancellationToken);

        return result;
    }

    public async Task<DiagramInfrastructureReconciliationResult?> TryGetReconciliationAsync(
        ScopeContext scope,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureDiagramReconciliationPersistRecord? record = await this.reconciliationRepository.TryGetByRunAndSnapshotAsync(
            scope.TenantId,
            runId,
            snapshotId,
            cancellationToken);

        if (record is null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(record.ResultJson, JsonOptions);
    }
}
