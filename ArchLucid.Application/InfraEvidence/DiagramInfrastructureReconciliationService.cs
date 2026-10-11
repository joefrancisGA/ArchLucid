using System.Text.Json;

using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;
using ArchLucid.Core.InfraEvidence;

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
    private readonly IInfrastructureDiagramDocumentationDecisionRepository documentationDecisionRepository;
    private readonly IAuthorityQueryService authorityQueryService;
    private readonly IManifestHashService manifestHashService;

    public DiagramInfrastructureReconciliationService(
        IStructuredDiagramIngestService diagramIngestService,
        IAzureInventorySnapshotRepository snapshotRepository,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IInfrastructureDiagramDocumentationDecisionRepository documentationDecisionRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService)
    {
        this.diagramIngestService = diagramIngestService;
        this.snapshotRepository = snapshotRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.documentationDecisionRepository = documentationDecisionRepository;
        this.authorityQueryService = authorityQueryService;
        this.manifestHashService = manifestHashService;
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

        await DiagramInfrastructureReconciliationSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            this.authorityQueryService,
            this.manifestHashService,
            cancellationToken);

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

        await DiagramInfrastructureReconciliationSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            this.authorityQueryService,
            this.manifestHashService,
            cancellationToken);

        return JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(record.ResultJson, JsonOptions);
    }

    public async Task<InfrastructureDiagramDocumentationDecision> SaveDocumentationDecisionAsync(
        ScopeContext scope,
        Guid runId,
        InfrastructureDiagramDocumentationDecisionSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (runId == Guid.Empty || request.SnapshotId == Guid.Empty)
        {
            throw new ArgumentException("RunId and SnapshotId are required.", nameof(request));
        }

        DiagramInfrastructureReconciliationResult? result = await this.TryGetReconciliationAsync(
            scope,
            runId,
            request.SnapshotId,
            cancellationToken);

        if (result is null)
        {
            throw new InvalidOperationException("Diagram reconciliation was not found for the run and snapshot.");
        }

        if (!InfrastructureDiagramComparisonService.CanSaveDocumentationDecision(
                result,
                request.SubjectKind,
                request.SubjectKey))
        {
            throw new ArgumentException(
                "Documentation decisions are only allowed for documentation-only reconciliation gaps.",
                nameof(request));
        }

        ValidateDocumentationDecision(request.Decision);

        ArchitectureDiagramModelRecord? diagram = await this.diagramIngestService.TryGetModelAsync(
            scope,
            runId,
            cancellationToken);

        if (diagram is null)
        {
            throw new InvalidOperationException("Architecture diagram model was not found for the run.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        InfrastructureDiagramDocumentationDecisionPersistRecord record = new()
        {
            DecisionId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            ScopeId = runId,
            SnapshotId = request.SnapshotId,
            SubjectKind = request.SubjectKind.Trim(),
            SubjectKey = request.SubjectKey.Trim(),
            Decision = request.Decision.Trim(),
            DiagramFingerprint = InfrastructureDiagramFingerprint.Compute(diagram),
            EvidenceFingerprint = InfrastructureDiagramComparisonService.BuildEvidenceFingerprint(
                result,
                request.SubjectKind,
                request.SubjectKey),
            SavedByUserOid = savedByUserOid,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await this.documentationDecisionRepository.UpsertAsync(record, cancellationToken);

        return InfrastructureDiagramComparisonService.ToDocumentationDecision(
            record,
            InfrastructureDiagramDocumentationDecisionValues.StillOpen);
    }

    public async Task<IReadOnlyList<InfrastructureDiagramDocumentationDecision>?> TryListDocumentationDecisionsAsync(
        ScopeContext scope,
        Guid runId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DiagramInfrastructureReconciliationResult? result = await this.TryGetReconciliationAsync(
            scope,
            runId,
            snapshotId,
            cancellationToken);

        if (result is null)
        {
            return null;
        }

        ArchitectureDiagramModelRecord? diagram = await this.diagramIngestService.TryGetModelAsync(
            scope,
            runId,
            cancellationToken);

        if (diagram is null)
        {
            return null;
        }

        string diagramFingerprint = InfrastructureDiagramFingerprint.Compute(diagram);
        IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord> records =
            await this.documentationDecisionRepository.ListByScopeAndDiagramFingerprintAsync(
                scope.TenantId,
                runId,
                diagramFingerprint,
                cancellationToken);

        return records
            .Select(record =>
            {
                string? currentFingerprint =
                    InfrastructureDiagramComparisonService.TryBuildEvidenceFingerprint(
                        result,
                        record.SubjectKind,
                        record.SubjectKey);
                string carryForwardState = currentFingerprint is null
                    ? InfrastructureDiagramDocumentationDecisionValues.NoLongerInCapture
                    : string.Equals(currentFingerprint, record.EvidenceFingerprint, StringComparison.Ordinal)
                        ? InfrastructureDiagramDocumentationDecisionValues.StillOpen
                        : InfrastructureDiagramDocumentationDecisionValues.EvidenceChanged;

                return InfrastructureDiagramComparisonService.ToDocumentationDecision(record, carryForwardState);
            })
            .ToList();
    }

    private static void ValidateDocumentationDecision(string decision)
    {
        if (decision is not
            InfrastructureDiagramDocumentationDecisionValues.UpdateDrawing
            and not InfrastructureDiagramDocumentationDecisionValues.AcceptAsUndocumented
            and not InfrastructureDiagramDocumentationDecisionValues.CheckInventory)
        {
            throw new ArgumentException("Decision is not supported.", nameof(decision));
        }
    }
}
