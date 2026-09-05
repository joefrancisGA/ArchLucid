using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

public sealed class StructuredDiagramIngestService : IStructuredDiagramIngestService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly StructuredDiagramParseRouter parseRouter;
    private readonly IArchitectureDiagramModelRepository repository;
    private readonly IAuthorityQueryService authorityQueryService;
    private readonly IManifestHashService manifestHashService;

    public StructuredDiagramIngestService(
        StructuredDiagramParseRouter parseRouter,
        IArchitectureDiagramModelRepository repository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService)
    {
        this.parseRouter = parseRouter;
        this.repository = repository;
        this.authorityQueryService = authorityQueryService;
        this.manifestHashService = manifestHashService;
    }

    public async Task<StructuredDiagramIngestResult> IngestAsync(
        ScopeContext scope,
        Guid runId,
        StructuredDiagramIngestRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        await StructuredDiagramIngestSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            this.authorityQueryService,
            this.manifestHashService,
            cancellationToken);

        ArchitectureDiagramModelRecord merged = new();
        List<string> warnings = [];
        List<string> fingerprints = [];

        foreach (DiagramSourceReference source in request.Sources)
        {
            DiagramParseResult parsed = this.parseRouter.Parse(source);
            warnings.AddRange(parsed.Warnings);
            MergeModel(merged, parsed.Model);
            fingerprints.Add(ComputeFingerprint(source));
        }

        string modelJson = JsonSerializer.Serialize(merged, JsonOptions);
        string warningsJson = JsonSerializer.Serialize(warnings, JsonOptions);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await this.repository.UpsertAsync(
            new ArchitectureDiagramModelPersistRecord
            {
                DiagramModelId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                RunId = runId,
                ModelJson = modelJson,
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
                WarningsJson = warningsJson,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            cancellationToken);

        return new StructuredDiagramIngestResult
        {
            Model = merged,
            Warnings = warnings,
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            SourceFingerprints = fingerprints,
        };
    }

    public async Task<ArchitectureDiagramModelRecord?> TryGetModelAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureDiagramModelPersistRecord? record = await this.repository.TryGetByRunAsync(
            scope.TenantId,
            runId,
            cancellationToken);

        if (record is null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<ArchitectureDiagramModelRecord>(record.ModelJson, JsonOptions);
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

    private static string ComputeFingerprint(DiagramSourceReference source)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{source.Format}:{source.Content}"));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
