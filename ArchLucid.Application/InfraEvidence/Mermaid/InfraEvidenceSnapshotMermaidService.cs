using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public sealed class InfraEvidenceSnapshotMermaidService(
    IAzureInventorySnapshotGraphResolver graphResolver,
    IDiagramAstFromGraphCompiler graphCompiler,
    IMermaidDiagramRenderPipeline renderPipeline,
    IBrandedDiagramExportService brandedDiagramExportService,
    IDiagramImageRenderer diagramImageRenderer,
    MermaidDiagramReadabilityThresholds? readabilityThresholds = null) : IInfraEvidenceSnapshotMermaidService
{
    private static readonly (string ModeKey, DiagramMode DiagramMode)[] PreviewModes =
    [
        ("executive", DiagramMode.Executive),
        ("network", DiagramMode.Network),
        ("identity", DiagramMode.Identity),
        ("data", DiagramMode.Data),
        ("full", DiagramMode.FullSubscription),
    ];

    private readonly IAzureInventorySnapshotGraphResolver _graphResolver =
        graphResolver ?? throw new ArgumentNullException(nameof(graphResolver));

    private readonly IDiagramAstFromGraphCompiler _graphCompiler =
        graphCompiler ?? throw new ArgumentNullException(nameof(graphCompiler));

    private readonly IMermaidDiagramRenderPipeline _renderPipeline =
        renderPipeline ?? throw new ArgumentNullException(nameof(renderPipeline));

    private readonly IBrandedDiagramExportService _brandedDiagramExportService =
        brandedDiagramExportService ?? throw new ArgumentNullException(nameof(brandedDiagramExportService));

    private readonly IDiagramImageRenderer _diagramImageRenderer =
        diagramImageRenderer ?? throw new ArgumentNullException(nameof(diagramImageRenderer));

    private readonly MermaidDiagramReadabilityThresholds _thresholds =
        readabilityThresholds ?? new MermaidDiagramReadabilityThresholds();

    public async Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse>> TryGetPreviewAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(scope, snapshotId, cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
        {
            return NotFound<InfraEvidenceMermaidPreviewResponse>(
                graphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
        }

        List<InfraEvidenceMermaidModePreview> modePreviews = [];

        foreach ((string modeKey, DiagramMode diagramMode) in PreviewModes)
        {
            MermaidDiagramRenderResult renderResult = await RenderModeAsync(
                graphResult.Graph,
                diagramMode,
                null,
                cancellationToken);

            modePreviews.Add(MapModePreview(modeKey, renderResult));
        }

        return new InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse>
        {
            Succeeded = true,
            Value = new InfraEvidenceMermaidPreviewResponse
            {
                SnapshotId = snapshotId,
                Modes = modePreviews,
            },
        };
    }

    public async Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>> TryGetMermaidAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(scope, snapshotId, cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
        {
            return NotFound<InfraEvidenceMermaidRenderResponse>(
                graphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
        }

        if (!string.IsNullOrWhiteSpace(fallbackKey))
        {
            return await RenderFallbackAsync(
                snapshotId,
                graphResult.Graph,
                fallbackKey,
                cancellationToken);
        }

        if (!InfraEvidenceMermaidModeParser.TryParse(mode, seedNodeId, out InfraEvidenceMermaidModeParseResult parsedMode))
        {
            return BadRequest<InfraEvidenceMermaidRenderResponse>(parsedMode.ErrorMessage ?? "Invalid mode.");
        }

        MermaidDiagramRenderResult renderResult = await RenderModeAsync(
            graphResult.Graph,
            parsedMode.DiagramMode,
            parsedMode.CompileOptions,
            cancellationToken);

        return new InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>
        {
            Succeeded = true,
            Value = MapRenderResponse(snapshotId, parsedMode.ModeKey, null, renderResult),
        };
    }

    public async Task<InfraEvidenceMermaidServiceResult<byte[]>> TryExportPngAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> mermaidResult =
            await TryGetMermaidAsync(scope, snapshotId, mode, fallbackKey, seedNodeId, cancellationToken);

        if (!mermaidResult.Succeeded || mermaidResult.Value is null)
        {
            return new InfraEvidenceMermaidServiceResult<byte[]>
            {
                Succeeded = false,
                ErrorMessage = mermaidResult.ErrorMessage,
                IsNotFound = mermaidResult.IsNotFound,
                IsBadRequest = mermaidResult.IsBadRequest,
            };
        }

        if (string.IsNullOrWhiteSpace(mermaidResult.Value.Mermaid))
        {
            return BadRequest<byte[]>("Mermaid source is unavailable for the requested mode.");
        }

        string brandedMermaid = await _brandedDiagramExportService.DecorateMermaidSourceForExportAsync(
            scope.TenantId,
            mermaidResult.Value.Mermaid,
            BrandingDisplayContext.MermaidDiagram,
            cancellationToken);

        byte[]? renderedPng = await _diagramImageRenderer.RenderMermaidPngAsync(brandedMermaid, cancellationToken);

        if (renderedPng is null || renderedPng.Length == 0)
        {
            return new InfraEvidenceMermaidServiceResult<byte[]>
            {
                Succeeded = false,
                ErrorMessage = "PNG rendering is unavailable in this environment.",
            };
        }

        byte[]? wrappedPng = await _brandedDiagramExportService.WrapRenderedPngForExportAsync(
            scope.TenantId,
            renderedPng,
            BrandingDisplayContext.MermaidDiagram,
            cancellationToken);

        return new InfraEvidenceMermaidServiceResult<byte[]>
        {
            Succeeded = true,
            Value = wrappedPng ?? renderedPng,
        };
    }

    private async Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>> RenderFallbackAsync(
        Guid snapshotId,
        GraphSnapshot graph,
        string fallbackKey,
        CancellationToken cancellationToken)
    {
        MermaidDiagramRenderResult fullRender = await RenderModeAsync(
            graph,
            DiagramMode.FullSubscription,
            null,
            cancellationToken);

        MermaidDiagramRenderArtifact? artifact = fullRender.FallbackArtifacts
            .FirstOrDefault(candidate => string.Equals(candidate.Key, fallbackKey, StringComparison.OrdinalIgnoreCase));

        if (artifact is null)
        {
            return BadRequest<InfraEvidenceMermaidRenderResponse>(
                $"Fallback artifact '{fallbackKey}' was not found.");
        }

        return new InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>
        {
            Succeeded = true,
            Value = new InfraEvidenceMermaidRenderResponse
            {
                SnapshotId = snapshotId,
                Mode = fallbackKey,
                FallbackKey = fallbackKey,
                Status = artifact.Status.ToString(),
                Mermaid = artifact.Status == MermaidDiagramRenderStatus.Succeeded ? artifact.Mermaid : null,
                Metrics = artifact.Metrics is null ? null : MapMetrics(artifact.Metrics),
                FallbackArtifacts = MapFallbackSummaries(fullRender.FallbackArtifacts),
            },
        };
    }

    private async Task<MermaidDiagramRenderResult> RenderModeAsync(
        GraphSnapshot graph,
        DiagramMode diagramMode,
        DiagramAstCompileOptions? compileOptions,
        CancellationToken cancellationToken)
    {
        DiagramAst ast = _graphCompiler.Compile(graph, diagramMode, compileOptions);

        return await _renderPipeline.RenderAsync(
            new MermaidDiagramRenderRequest
            {
                Ast = ast,
                Thresholds = _thresholds,
            },
            graph,
            cancellationToken);
    }

    private InfraEvidenceMermaidModePreview MapModePreview(string modeKey, MermaidDiagramRenderResult renderResult)
    {
        bool includeMermaid = renderResult.Status == MermaidDiagramRenderStatus.Succeeded;

        return new InfraEvidenceMermaidModePreview
        {
            Mode = modeKey,
            Status = renderResult.Status.ToString(),
            NodeCount = renderResult.Metrics.NodeCount,
            EdgeCount = renderResult.Metrics.EdgeCount,
            Mermaid = includeMermaid ? renderResult.PrimaryMermaid : null,
            FallbackArtifacts = MapFallbackSummaries(renderResult.FallbackArtifacts),
        };
    }

    private InfraEvidenceMermaidRenderResponse MapRenderResponse(
        Guid snapshotId,
        string modeKey,
        string? fallbackKey,
        MermaidDiagramRenderResult renderResult)
    {
        bool includeMermaid = renderResult.Status == MermaidDiagramRenderStatus.Succeeded
            || renderResult.Status == MermaidDiagramRenderStatus.Partitioned;

        return new InfraEvidenceMermaidRenderResponse
        {
            SnapshotId = snapshotId,
            Mode = modeKey,
            FallbackKey = fallbackKey,
            Status = renderResult.Status.ToString(),
            Mermaid = includeMermaid ? renderResult.PrimaryMermaid : null,
            Metrics = MapMetrics(renderResult.Metrics),
            FallbackArtifacts = MapFallbackSummaries(renderResult.FallbackArtifacts),
        };
    }

    private static List<InfraEvidenceMermaidFallbackArtifactSummary> MapFallbackSummaries(
        IReadOnlyList<MermaidDiagramRenderArtifact> artifacts)
    {
        List<InfraEvidenceMermaidFallbackArtifactSummary> summaries = [];

        foreach (MermaidDiagramRenderArtifact artifact in artifacts)
        {
            summaries.Add(new InfraEvidenceMermaidFallbackArtifactSummary
            {
                Key = artifact.Key,
                Label = artifact.Label,
                Status = artifact.Status.ToString(),
                NodeCount = artifact.Metrics?.NodeCount ?? 0,
                EdgeCount = artifact.Metrics?.EdgeCount ?? 0,
            });
        }

        return summaries;
    }

    private static InfraEvidenceMermaidComplexityMetrics MapMetrics(MermaidDiagramComplexityMetrics metrics)
    {
        return new InfraEvidenceMermaidComplexityMetrics
        {
            NodeCount = metrics.NodeCount,
            EdgeCount = metrics.EdgeCount,
            SubgraphCount = metrics.SubgraphCount,
            MaxDegree = metrics.MaxDegree,
            CrossSubgraphEdgeCount = metrics.CrossSubgraphEdgeCount,
            TextSizeBytes = metrics.TextSizeBytes,
            LayoutEstimate = metrics.LayoutEstimate,
        };
    }

    private static InfraEvidenceMermaidServiceResult<T> NotFound<T>(string message)
    {
        return new InfraEvidenceMermaidServiceResult<T>
        {
            Succeeded = false,
            IsNotFound = true,
            ErrorMessage = message,
        };
    }

    private static InfraEvidenceMermaidServiceResult<T> BadRequest<T>(string message)
    {
        return new InfraEvidenceMermaidServiceResult<T>
        {
            Succeeded = false,
            IsBadRequest = true,
            ErrorMessage = message,
        };
    }
}
