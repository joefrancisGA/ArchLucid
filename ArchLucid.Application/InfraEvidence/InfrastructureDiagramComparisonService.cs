using System.Text.Json;

using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.ContextIngestion;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class InfrastructureDiagramComparisonService : IInfrastructureDiagramComparisonService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private static readonly HashSet<string> SupportedDiagramFormats = new(StringComparer.OrdinalIgnoreCase)
    {
        SupportedContextDocumentContentTypes.Mermaid,
        SupportedContextDocumentContentTypes.StructuredDiagramJson,
        SupportedContextDocumentContentTypes.StructuredDiagramSvg,
        SupportedContextDocumentContentTypes.DrawIoXml,
        SupportedContextDocumentContentTypes.VisioVsdx,
    };

    private readonly StructuredDiagramParseRouter parseRouter;
    private readonly IAzureInventorySnapshotRepository snapshotRepository;
    private readonly IInfrastructureDiagramComparisonRepository comparisonRepository;
    private readonly IInfrastructureDiagramNodeMappingRepository mappingRepository;

    public InfrastructureDiagramComparisonService(
        StructuredDiagramParseRouter parseRouter,
        IAzureInventorySnapshotRepository snapshotRepository,
        IInfrastructureDiagramComparisonRepository comparisonRepository,
        IInfrastructureDiagramNodeMappingRepository mappingRepository)
    {
        this.parseRouter = parseRouter;
        this.snapshotRepository = snapshotRepository;
        this.comparisonRepository = comparisonRepository;
        this.mappingRepository = mappingRepository;
    }

    public async Task<DiagramInfrastructureReconciliationResult> CompareAsync(
        ScopeContext scope,
        InfrastructureDiagramComparisonCreateRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (request.SnapshotId == Guid.Empty)
        {
            throw new ArgumentException("SnapshotId is required.", nameof(request));
        }

        if (request.Sources.Count == 0)
        {
            throw new ArgumentException("At least one diagram source is required.", nameof(request));
        }

        ValidateSources(request.Sources);

        ArchitectureDiagramModelRecord diagram = ParseDiagram(request.Sources);

        AzureInventorySnapshotDetailReadModel? snapshot = await this.snapshotRepository.TryGetSnapshotDetailAsync(
            scope,
            request.SnapshotId,
            cancellationToken);

        if (snapshot is null)
        {
            throw new InvalidOperationException("Azure inventory snapshot was not found in the current scope.");
        }

        IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord> mappings =
            await this.mappingRepository.ListBySnapshotAsync(scope.TenantId, request.SnapshotId, cancellationToken);

        Guid comparisonId = Guid.NewGuid();
        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            Guid.Empty,
            request.SnapshotId,
            mappings,
            comparisonId);

        await PersistComparisonAsync(
            scope,
            comparisonId,
            request.SnapshotId,
            request.Sources,
            result,
            cancellationToken);

        _ = savedByUserOid;

        return result;
    }

    public async Task<DiagramInfrastructureReconciliationResult?> TryGetComparisonAsync(
        ScopeContext scope,
        Guid comparisonId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        InfrastructureDiagramComparisonPersistRecord? record = await this.comparisonRepository.TryGetAsync(
            scope.TenantId,
            comparisonId,
            cancellationToken);

        if (record is null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(record.ResultJson, JsonOptions);
    }

    public async Task<DiagramInfrastructureReconciliationResult> SaveNodeMappingAndRefreshAsync(
        ScopeContext scope,
        Guid comparisonId,
        InfrastructureDiagramNodeMappingSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (request.CloudResourceId == Guid.Empty)
        {
            throw new ArgumentException("CloudResourceId is required.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.NormalizedDiagramLabel))
        {
            throw new ArgumentException("NormalizedDiagramLabel is required.", nameof(request));
        }

        InfrastructureDiagramComparisonPersistRecord? comparison = await this.comparisonRepository.TryGetAsync(
            scope.TenantId,
            comparisonId,
            cancellationToken);

        if (comparison is null)
        {
            throw new InvalidOperationException("Diagram comparison was not found in the current scope.");
        }

        AzureInventorySnapshotDetailReadModel? snapshot = await this.snapshotRepository.TryGetSnapshotDetailAsync(
            scope,
            comparison.SnapshotId,
            cancellationToken);

        if (snapshot is null)
        {
            throw new InvalidOperationException("Azure inventory snapshot was not found in the current scope.");
        }

        AzureInventoryResourceRecord? resource = snapshot.Resources
            .FirstOrDefault(candidate => candidate.CloudResourceId == request.CloudResourceId);

        if (resource is null)
        {
            throw new InvalidOperationException("Cloud resource was not found in the selected inventory capture.");
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await this.mappingRepository.UpsertAsync(
            new InfrastructureDiagramNodeMappingPersistRecord
            {
                MappingId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                SnapshotId = comparison.SnapshotId,
                NormalizedDiagramLabel = request.NormalizedDiagramLabel.Trim().ToLowerInvariant(),
                DiagramNodeId = string.IsNullOrWhiteSpace(request.DiagramNodeId) ? null : request.DiagramNodeId.Trim(),
                CloudResourceId = request.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                SavedByUserOid = savedByUserOid,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            cancellationToken);

        List<DiagramSourceReference> sources =
            JsonSerializer.Deserialize<List<DiagramSourceReference>>(comparison.SourcesJson, JsonOptions) ?? [];

        ArchitectureDiagramModelRecord diagram = ParseDiagram(sources);

        IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord> mappings =
            await this.mappingRepository.ListBySnapshotAsync(scope.TenantId, comparison.SnapshotId, cancellationToken);

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            Guid.Empty,
            comparison.SnapshotId,
            mappings,
            comparisonId);

        await PersistComparisonAsync(
            scope,
            comparisonId,
            comparison.SnapshotId,
            sources,
            result,
            cancellationToken);

        return result;
    }

    private async Task PersistComparisonAsync(
        ScopeContext scope,
        Guid comparisonId,
        Guid snapshotId,
        List<DiagramSourceReference> sources,
        DiagramInfrastructureReconciliationResult result,
        CancellationToken cancellationToken)
    {
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        string sourcesJson = JsonSerializer.Serialize(sources, JsonOptions);
        string resultJson = JsonSerializer.Serialize(result, JsonOptions);

        InfrastructureDiagramComparisonPersistRecord? existing = await this.comparisonRepository.TryGetAsync(
            scope.TenantId,
            comparisonId,
            cancellationToken);

        await this.comparisonRepository.UpsertAsync(
            new InfrastructureDiagramComparisonPersistRecord
            {
                ComparisonId = comparisonId,
                TenantId = scope.TenantId,
                SnapshotId = snapshotId,
                SourcesJson = sourcesJson,
                ResultJson = resultJson,
                CreatedUtc = existing?.CreatedUtc ?? utcNow,
                UpdatedUtc = utcNow,
            },
            cancellationToken);
    }

    private ArchitectureDiagramModelRecord ParseDiagram(IReadOnlyList<DiagramSourceReference> sources)
    {
        ArchitectureDiagramModelRecord merged = new();

        foreach (DiagramSourceReference source in sources)
        {
            DiagramParseResult parsed = this.parseRouter.Parse(source);
            MergeModel(merged, parsed.Model);
        }

        return merged;
    }

    private static void ValidateSources(IReadOnlyList<DiagramSourceReference> sources)
    {
        foreach (DiagramSourceReference source in sources)
        {
            if (SupportedContextDocumentContentTypes.IsForbiddenImageContentType(source.Format))
            {
                throw new InvalidOperationException(
                    $"Unsupported diagram source format '{source.Format}'. Raster images are not accepted for structured diagram comparison.");
            }

            if (!SupportedDiagramFormats.Contains(source.Format))
            {
                throw new InvalidOperationException(
                    $"Unsupported diagram source format '{source.Format}'. Use Mermaid, Visio .vsdx, draw.io, sanitized SVG, or diagram JSON.");
            }
        }
    }

    private static void MergeModel(ArchitectureDiagramModelRecord target, ArchitectureDiagramModelRecord source)
    {
        Dictionary<string, ArchitectureDiagramNodeRecord> nodes = target.Nodes
            .ToDictionary(node => node.Id, StringComparer.Ordinal);

        foreach (ArchitectureDiagramNodeRecord node in source.Nodes)
        {
            nodes[node.Id] = node;
        }

        target.Nodes = nodes.Values.OrderBy(node => node.Id, StringComparer.Ordinal).ToList();

        HashSet<string> edgeKeys = target.Edges
            .Select(edge => $"{edge.SourceId}|{edge.TargetId}|{edge.Label}")
            .ToHashSet(StringComparer.Ordinal);

        foreach (ArchitectureDiagramEdgeRecord edge in source.Edges)
        {
            string key = $"{edge.SourceId}|{edge.TargetId}|{edge.Label}";

            if (edgeKeys.Add(key))
            {
                target.Edges.Add(edge);
            }
        }

        foreach (string label in source.TrustBoundaryLabels)
        {
            if (!target.TrustBoundaryLabels.Contains(label, StringComparer.Ordinal))
            {
                target.TrustBoundaryLabels.Add(label);
            }
        }
    }
}
