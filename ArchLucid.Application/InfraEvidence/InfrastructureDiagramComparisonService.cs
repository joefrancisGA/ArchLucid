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
    private readonly IInfrastructureDiagramDocumentationDecisionRepository documentationDecisionRepository;

    public InfrastructureDiagramComparisonService(
        StructuredDiagramParseRouter parseRouter,
        IAzureInventorySnapshotRepository snapshotRepository,
        IInfrastructureDiagramComparisonRepository comparisonRepository,
        IInfrastructureDiagramNodeMappingRepository mappingRepository,
        IInfrastructureDiagramDocumentationDecisionRepository documentationDecisionRepository)
    {
        this.parseRouter = parseRouter;
        this.snapshotRepository = snapshotRepository;
        this.comparisonRepository = comparisonRepository;
        this.mappingRepository = mappingRepository;
        this.documentationDecisionRepository = documentationDecisionRepository;
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
        string diagramFingerprint = InfrastructureDiagramFingerprint.Compute(diagram);

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
            diagramFingerprint,
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

        string diagramFingerprint = comparison.DiagramFingerprint
            ?? InfrastructureDiagramFingerprint.Compute(diagram);

        await PersistComparisonAsync(
            scope,
            comparisonId,
            comparison.SnapshotId,
            sources,
            diagramFingerprint,
            result,
            cancellationToken);

        return result;
    }

    public async Task<InfrastructureDiagramDocumentationDecision> SaveDocumentationDecisionAsync(
        ScopeContext scope,
        Guid comparisonId,
        InfrastructureDiagramDocumentationDecisionSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        InfrastructureDiagramComparisonPersistRecord? comparison =
            await this.comparisonRepository.TryGetAsync(scope.TenantId, comparisonId, cancellationToken);

        if (comparison is null)
        {
            throw new InvalidOperationException("Diagram comparison was not found in the current scope.");
        }

        if (request.SnapshotId != comparison.SnapshotId)
        {
            throw new ArgumentException("SnapshotId does not match the selected diagram comparison.", nameof(request));
        }

        DiagramInfrastructureReconciliationResult? result =
            JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(comparison.ResultJson, JsonOptions);

        if (result is null || !CanSaveDocumentationDecision(result, request.SubjectKind, request.SubjectKey))
        {
            throw new ArgumentException("Documentation decisions are only allowed for documentation-only reconciliation gaps.", nameof(request));
        }

        string diagramFingerprint = comparison.DiagramFingerprint
            ?? InfrastructureDiagramFingerprint.Compute(ParseDiagram(
                JsonSerializer.Deserialize<List<DiagramSourceReference>>(comparison.SourcesJson, JsonOptions) ?? []));

        ValidateDocumentationDecision(request.Decision);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        string evidenceFingerprint = BuildEvidenceFingerprint(result, request.SubjectKind, request.SubjectKey);
        InfrastructureDiagramDocumentationDecisionPersistRecord record = new()
        {
            DecisionId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            ScopeId = comparisonId,
            SnapshotId = request.SnapshotId,
            SubjectKind = request.SubjectKind.Trim(),
            SubjectKey = request.SubjectKey.Trim(),
            Decision = request.Decision.Trim(),
            DiagramFingerprint = diagramFingerprint,
            EvidenceFingerprint = evidenceFingerprint,
            SavedByUserOid = savedByUserOid,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await this.documentationDecisionRepository.UpsertAsync(record, cancellationToken);

        return ToDocumentationDecision(record, InfrastructureDiagramDocumentationDecisionValues.StillOpen);
    }

    public async Task<InfrastructureDiagramDocumentationDecision?> TryGetDocumentationDecisionAsync(
        ScopeContext scope,
        Guid comparisonId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        InfrastructureDiagramComparisonPersistRecord? comparison =
            await this.comparisonRepository.TryGetAsync(scope.TenantId, comparisonId, cancellationToken);

        if (comparison is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(comparison.DiagramFingerprint))
        {
            return null;
        }

        DiagramInfrastructureReconciliationResult? result =
            JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(comparison.ResultJson, JsonOptions);
        InfrastructureDiagramDocumentationDecisionPersistRecord? record =
            await this.documentationDecisionRepository.TryGetLatestBySubjectAsync(
                scope.TenantId,
                comparison.DiagramFingerprint,
                subjectKind.Trim(),
                subjectKey.Trim(),
                cancellationToken);

        if (record is null)
        {
            return null;
        }

        string? currentFingerprint = result is null
            ? null
            : TryBuildEvidenceFingerprint(result, subjectKind, subjectKey);
        string carryForwardState = currentFingerprint is null
            ? InfrastructureDiagramDocumentationDecisionValues.NoLongerInCapture
            : string.Equals(currentFingerprint, record.EvidenceFingerprint, StringComparison.Ordinal)
                ? InfrastructureDiagramDocumentationDecisionValues.StillOpen
                : InfrastructureDiagramDocumentationDecisionValues.EvidenceChanged;

        return ToDocumentationDecision(record, carryForwardState);
    }

    public async Task<IReadOnlyList<InfrastructureDiagramDocumentationDecision>?> TryListAbsentDocumentationDecisionsAsync(
        ScopeContext scope,
        Guid comparisonId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        InfrastructureDiagramComparisonPersistRecord? comparison =
            await this.comparisonRepository.TryGetAsync(scope.TenantId, comparisonId, cancellationToken);

        if (comparison is null || string.IsNullOrWhiteSpace(comparison.DiagramFingerprint))
        {
            return null;
        }

        DiagramInfrastructureReconciliationResult? result =
            JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(comparison.ResultJson, JsonOptions);

        if (result is null)
        {
            return [];
        }

        HashSet<(string SubjectKind, string SubjectKey)> presentSubjects = BuildPresentDocumentationSubjects(result);
        IReadOnlyList<InfrastructureDiagramDocumentationDecisionPersistRecord> records =
            await this.documentationDecisionRepository.ListByDiagramFingerprintAsync(
                scope.TenantId,
                comparison.DiagramFingerprint,
                cancellationToken);

        return records
            .Where(record => !presentSubjects.Contains((record.SubjectKind, record.SubjectKey)))
            .Select(record => ToDocumentationDecision(
                record,
                InfrastructureDiagramDocumentationDecisionValues.NoLongerInCapture))
            .ToList();
    }

    internal static bool CanSaveDocumentationDecision(
        DiagramInfrastructureReconciliationResult result,
        string subjectKind,
        string subjectKey)
    {
        string normalizedSubjectKind = subjectKind.Trim();
        string normalizedSubjectKey = subjectKey.Trim();

        if (normalizedSubjectKind == "DiagramNode")
        {
            return result.Rows.Any(row =>
                row.MatchKind == DiagramInfrastructureMatchKinds.DiagramOnly
                && string.Equals(row.DiagramNodeId, normalizedSubjectKey, StringComparison.Ordinal));
        }

        if (normalizedSubjectKind == "InventoryResource")
        {
            return result.Rows.Any(row =>
                row.MatchKind == DiagramInfrastructureMatchKinds.InfrastructureOnly
                && row.CloudResourceId.HasValue
                && row.CloudResourceId.Value.ToString("D") == normalizedSubjectKey);
        }

        if (normalizedSubjectKind == "EdgeGap")
        {
            return result.EdgeGaps.Any(edgeGap =>
                string.Equals(edgeGap.EdgeGapId, normalizedSubjectKey, StringComparison.Ordinal));
        }

        return false;
    }

    private static HashSet<(string SubjectKind, string SubjectKey)> BuildPresentDocumentationSubjects(
        DiagramInfrastructureReconciliationResult result)
    {
        HashSet<(string SubjectKind, string SubjectKey)> subjects = [];

        foreach (DiagramInfrastructureCorrespondenceRow row in result.Rows)
        {
            if (row.MatchKind == DiagramInfrastructureMatchKinds.DiagramOnly
                && row.DiagramNodeId is not null)
            {
                subjects.Add(("DiagramNode", row.DiagramNodeId));
            }

            if (row.MatchKind == DiagramInfrastructureMatchKinds.InfrastructureOnly
                && row.CloudResourceId.HasValue)
            {
                subjects.Add(("InventoryResource", row.CloudResourceId.Value.ToString("D")));
            }
        }

        foreach (DiagramInfrastructureEdgeGapRow edgeGap in result.EdgeGaps)
        {
            subjects.Add(("EdgeGap", edgeGap.EdgeGapId));
        }

        return subjects;
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

    internal static string BuildEvidenceFingerprint(
        DiagramInfrastructureReconciliationResult result,
        string subjectKind,
        string subjectKey) =>
        TryBuildEvidenceFingerprint(result, subjectKind, subjectKey)
        ?? throw new ArgumentException("The documentation decision subject was not found.", nameof(subjectKey));

    internal static string? TryBuildEvidenceFingerprint(
        DiagramInfrastructureReconciliationResult result,
        string subjectKind,
        string subjectKey)
    {
        string normalizedSubjectKind = subjectKind.Trim();
        string normalizedSubjectKey = subjectKey.Trim();

        if (normalizedSubjectKind == "DiagramNode")
        {
            DiagramInfrastructureCorrespondenceRow? row = result.Rows.FirstOrDefault(candidate =>
                candidate.MatchKind == DiagramInfrastructureMatchKinds.DiagramOnly
                && string.Equals(candidate.DiagramNodeId, normalizedSubjectKey, StringComparison.Ordinal));

            return row is null
                ? null
                : $"{normalizedSubjectKind}:{row.MatchKind}:{row.CloudResourceId}:{row.SecurityDiscrepancy}";
        }

        if (normalizedSubjectKind == "InventoryResource")
        {
            DiagramInfrastructureCorrespondenceRow? row = result.Rows.FirstOrDefault(candidate =>
                candidate.MatchKind == DiagramInfrastructureMatchKinds.InfrastructureOnly
                && candidate.CloudResourceId.HasValue
                && candidate.CloudResourceId.Value.ToString("D") == normalizedSubjectKey);

            return row is null
                ? null
                : $"{normalizedSubjectKind}:{row.MatchKind}:{row.CloudResourceId}:{row.SecurityDiscrepancy}";
        }

        if (normalizedSubjectKind == "EdgeGap")
        {
            DiagramInfrastructureEdgeGapRow? edgeGap = result.EdgeGaps.FirstOrDefault(candidate =>
                string.Equals(candidate.EdgeGapId, normalizedSubjectKey, StringComparison.Ordinal));

            return edgeGap is null
                ? null
                : $"{normalizedSubjectKind}:{edgeGap.GapKind}:{edgeGap.FromCloudResourceId}:{edgeGap.ToCloudResourceId}:{edgeGap.AssociationType}";
        }

        return null;
    }

    internal static InfrastructureDiagramDocumentationDecision ToDocumentationDecision(
        InfrastructureDiagramDocumentationDecisionPersistRecord record,
        string carryForwardState) =>
        new()
        {
            ScopeId = record.ScopeId,
            SnapshotId = record.SnapshotId,
            SubjectKind = record.SubjectKind,
            SubjectKey = record.SubjectKey,
            Decision = record.Decision,
            CarryForwardState = carryForwardState,
            UpdatedUtc = record.UpdatedUtc,
        };

    private async Task PersistComparisonAsync(
        ScopeContext scope,
        Guid comparisonId,
        Guid snapshotId,
        List<DiagramSourceReference> sources,
        string diagramFingerprint,
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
                DiagramFingerprint = diagramFingerprint,
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
