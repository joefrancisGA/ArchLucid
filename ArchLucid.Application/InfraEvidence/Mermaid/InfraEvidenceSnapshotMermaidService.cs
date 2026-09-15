using ArchLucid.Application.Graphviz;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Diagrams;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public sealed class InfraEvidenceSnapshotMermaidService(
    IAzureInventorySnapshotGraphResolver graphResolver,
    IMermaidDiagramInventoryRenderOrchestrator inventoryRenderOrchestrator,
    IMermaidDiagramFallbackSetBuilder fallbackSetBuilder,
    IBrandedDiagramExportService brandedDiagramExportService,
    IDiagramImageRenderer diagramImageRenderer,
    IDiagramAstGraphvizDotEmitter graphvizDotEmitter,
    IDiagramForestLayoutSvgRenderer forestLayoutSvgRenderer,
    IGraphvizLayoutRenderer graphvizLayoutRenderer,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
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

    private readonly IMermaidDiagramInventoryRenderOrchestrator _inventoryRenderOrchestrator =
        inventoryRenderOrchestrator ?? throw new ArgumentNullException(nameof(inventoryRenderOrchestrator));

    private readonly IMermaidDiagramFallbackSetBuilder _fallbackSetBuilder =
        fallbackSetBuilder ?? throw new ArgumentNullException(nameof(fallbackSetBuilder));

    private readonly IBrandedDiagramExportService _brandedDiagramExportService =
        brandedDiagramExportService ?? throw new ArgumentNullException(nameof(brandedDiagramExportService));

    private readonly IDiagramImageRenderer _diagramImageRenderer =
        diagramImageRenderer ?? throw new ArgumentNullException(nameof(diagramImageRenderer));

    private readonly IDiagramAstGraphvizDotEmitter _graphvizDotEmitter =
        graphvizDotEmitter ?? throw new ArgumentNullException(nameof(graphvizDotEmitter));

    private readonly IDiagramForestLayoutSvgRenderer _forestLayoutSvgRenderer =
        forestLayoutSvgRenderer ?? throw new ArgumentNullException(nameof(forestLayoutSvgRenderer));

    private readonly IGraphvizLayoutRenderer _graphvizLayoutRenderer =
        graphvizLayoutRenderer ?? throw new ArgumentNullException(nameof(graphvizLayoutRenderer));

    private readonly IArchitectureDiagramReconciliationRepository _reconciliationRepository =
        reconciliationRepository ?? throw new ArgumentNullException(nameof(reconciliationRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly MermaidDiagramReadabilityThresholds _thresholds =
        readabilityThresholds ?? new MermaidDiagramReadabilityThresholds();

    public async Task<InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidPreviewResponse>> TryGetPreviewAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(scope, snapshotId, cancellationToken: cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
        {
            return NotFound<InfraEvidenceMermaidPreviewResponse>(
                graphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
        }

        List<InfraEvidenceMermaidModePreview> modePreviews = [];

        foreach ((string modeKey, DiagramMode diagramMode) in PreviewModes)
        {
            InfraEvidenceMermaidModePreview modePreview = await TryRenderModePreviewAsync(
                graphResult.Graph,
                modeKey,
                diagramMode,
                null,
                cancellationToken);

            modePreviews.Add(modePreview);
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
        bool includeNeverShowArmTypes = false,
        string? hiddenExecutiveTierKeys = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(scope, snapshotId, includeNeverShowArmTypes, cancellationToken);

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
                includeNeverShowArmTypes,
                cancellationToken);
        }

        if (!InfraEvidenceMermaidModeParser.TryParse(
                mode,
                seedNodeId,
                hiddenExecutiveTierKeys,
                out InfraEvidenceMermaidModeParseResult parsedMode))
        {
            return BadRequest<InfraEvidenceMermaidRenderResponse>(parsedMode.ErrorMessage ?? "Invalid mode.");
        }

        if (parsedMode.DiagramMode == DiagramMode.ResourceGroup
            && string.IsNullOrWhiteSpace(parsedMode.CompileOptions?.ResourceGroupName))
        {
            return CreateResourceGroupPickerResponse(snapshotId, graphResult.Graph);
        }

        InfraEvidenceMermaidRenderResponse renderResponse = await TryRenderModeResponseAsync(
            snapshotId,
            parsedMode.ModeKey,
            null,
            graphResult.Graph,
            parsedMode.DiagramMode,
            parsedMode.CompileOptions,
            includeNeverShowArmTypes,
            cancellationToken);

        return new InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>
        {
            Succeeded = true,
            Value = renderResponse,
        };
    }

    public async Task<InfraEvidenceMermaidServiceResult<byte[]>> TryExportPngAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        bool includeNeverShowArmTypes = false,
        string? hiddenExecutiveTierKeys = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> mermaidResult =
            await TryGetMermaidAsync(
                scope,
                snapshotId,
                mode,
                fallbackKey,
                seedNodeId,
                includeNeverShowArmTypes,
                hiddenExecutiveTierKeys,
                cancellationToken);

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

        byte[]? renderedPng = await TryRenderInventoryPngAsync(
            scope,
            snapshotId,
            mode,
            fallbackKey,
            seedNodeId,
            includeNeverShowArmTypes,
            hiddenExecutiveTierKeys,
            mermaidResult.Value,
            brandedMermaid,
            cancellationToken);

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
        bool includeNeverShowArmTypes,
        CancellationToken cancellationToken)
    {
        MermaidDiagramRenderResult fullRender = await RenderModeAsync(
            graph,
            DiagramMode.FullSubscription,
            null,
            includeNeverShowArmTypes,
            cancellationToken);

        MermaidDiagramRenderArtifact? artifact = fullRender.FallbackArtifacts
            .FirstOrDefault(candidate => string.Equals(candidate.Key, fallbackKey, StringComparison.OrdinalIgnoreCase));

        if (artifact is null
            && InventoryDiagramFallbackArtifactKeys.TryReadResourceGroupName(fallbackKey, out string resourceGroupName))
        {
            artifact = _fallbackSetBuilder
                .BuildResourceGroupFallbackSet(graph, _thresholds)
                .FirstOrDefault(candidate =>
                    string.Equals(candidate.Key, InventoryDiagramFallbackArtifactKeys.ForResourceGroup(resourceGroupName), StringComparison.OrdinalIgnoreCase)
                    || string.Equals(candidate.Key, fallbackKey, StringComparison.OrdinalIgnoreCase));
        }

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

    private async Task<InfraEvidenceMermaidModePreview> TryRenderModePreviewAsync(
        GraphSnapshot graph,
        string modeKey,
        DiagramMode diagramMode,
        DiagramAstCompileOptions? compileOptions,
        CancellationToken cancellationToken)
    {
        try
        {
            MermaidDiagramRenderResult renderResult = await RenderModeAsync(
                graph,
                diagramMode,
                compileOptions,
                includeNeverShowArmTypes: false,
                cancellationToken);

            return MapModePreview(modeKey, renderResult);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return CreateFailedModePreview(modeKey);
        }
    }

    private async Task<InfraEvidenceMermaidRenderResponse> TryRenderModeResponseAsync(
        Guid snapshotId,
        string modeKey,
        string? fallbackKey,
        GraphSnapshot graph,
        DiagramMode diagramMode,
        DiagramAstCompileOptions? compileOptions,
        bool includeNeverShowArmTypes,
        CancellationToken cancellationToken)
    {
        try
        {
            MermaidDiagramRenderResult renderResult = await RenderModeAsync(
                graph,
                diagramMode,
                compileOptions,
                includeNeverShowArmTypes,
                cancellationToken);

            InfraEvidenceInventoryLayoutResult layoutResult = await TryRenderInventoryLayoutAsync(
                renderResult,
                cancellationToken);

            return MapRenderResponse(snapshotId, modeKey, fallbackKey, renderResult, graph, layoutResult);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return CreateFailedRenderResponse(snapshotId, modeKey, fallbackKey);
        }
    }

    private Task<MermaidDiagramRenderResult> RenderModeAsync(
        GraphSnapshot graph,
        DiagramMode diagramMode,
        DiagramAstCompileOptions? compileOptions,
        bool includeNeverShowArmTypes,
        CancellationToken cancellationToken)
    {
        return _inventoryRenderOrchestrator.RenderFromGraphAsync(
            graph,
            diagramMode,
            compileOptions,
            _thresholds,
            includeNeverShowArmTypes,
            cancellationToken);
    }

    private InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse> CreateResourceGroupPickerResponse(
        Guid snapshotId,
        GraphSnapshot graph)
    {
        IReadOnlyList<MermaidDiagramRenderArtifact> artifacts =
            _fallbackSetBuilder.BuildResourceGroupFallbackSet(graph, _thresholds);

        return new InfraEvidenceMermaidServiceResult<InfraEvidenceMermaidRenderResponse>
        {
            Succeeded = true,
            Value = new InfraEvidenceMermaidRenderResponse
            {
                SnapshotId = snapshotId,
                Mode = InventoryDiagramFallbackArtifactKeys.ResourceGroupModeKey,
                FallbackKey = null,
                Status = MermaidDiagramRenderStatus.Succeeded.ToString(),
                Mermaid = null,
                Metrics = null,
                FallbackArtifacts = MapFallbackSummaries(artifacts),
            },
        };
    }

    private static InfraEvidenceMermaidModePreview CreateFailedModePreview(string modeKey)
    {
        return new InfraEvidenceMermaidModePreview
        {
            Mode = modeKey,
            Status = MermaidDiagramRenderStatus.Failed.ToString(),
            NodeCount = 0,
            EdgeCount = 0,
            Mermaid = null,
            FallbackArtifacts = [],
        };
    }

    private static InfraEvidenceMermaidRenderResponse CreateFailedRenderResponse(
        Guid snapshotId,
        string modeKey,
        string? fallbackKey)
    {
        return new InfraEvidenceMermaidRenderResponse
        {
            SnapshotId = snapshotId,
            Mode = modeKey,
            FallbackKey = fallbackKey,
            Status = MermaidDiagramRenderStatus.Failed.ToString(),
            Mermaid = null,
            Metrics = null,
            FallbackArtifacts = [],
        };
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
            Mermaid = InfraEvidenceMermaidResponseContent.SelectMermaidForClient(
                includeMermaid,
                renderResult.PrimaryMermaid,
                renderResult.Metrics),
            FallbackArtifacts = MapFallbackSummaries(renderResult.FallbackArtifacts),
        };
    }

    private async Task<byte[]?> TryRenderInventoryPngAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        bool includeNeverShowArmTypes,
        string? hiddenExecutiveTierKeys,
        InfraEvidenceMermaidRenderResponse renderResponse,
        string brandedMermaid,
        CancellationToken cancellationToken)
    {
        if (string.Equals(renderResponse.LayoutEngine, "inventory-forest", StringComparison.Ordinal)
            || string.Equals(renderResponse.LayoutEngine, "graphviz-fdp", StringComparison.Ordinal))
        {
            MermaidDiagramRenderResult? renderResult = await TryResolveLatestRenderResultAsync(
                scope,
                snapshotId,
                mode,
                fallbackKey,
                seedNodeId,
                includeNeverShowArmTypes,
                hiddenExecutiveTierKeys,
                cancellationToken);

            if (renderResult?.RepairedAst is not null)
            {
                string dot = _graphvizDotEmitter.Emit(renderResult.RepairedAst);
                GraphvizLayoutRenderResult graphvizPng = await _graphvizLayoutRenderer.RenderPngAsync(dot, cancellationToken);

                if (graphvizPng.Succeeded && graphvizPng.Png is { Length: > 0 })
                {
                    return graphvizPng.Png;
                }
            }
        }

        return await _diagramImageRenderer.RenderMermaidPngAsync(brandedMermaid, cancellationToken);
    }

    private async Task<MermaidDiagramRenderResult?> TryResolveLatestRenderResultAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? mode,
        string? fallbackKey,
        string? seedNodeId,
        bool includeNeverShowArmTypes,
        string? hiddenExecutiveTierKeys,
        CancellationToken cancellationToken)
    {
        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(scope, snapshotId, includeNeverShowArmTypes, cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(fallbackKey))
        {
            return null;
        }

        if (!InfraEvidenceMermaidModeParser.TryParse(
                mode,
                seedNodeId,
                hiddenExecutiveTierKeys,
                out InfraEvidenceMermaidModeParseResult parsedMode))
        {
            return null;
        }

        return await RenderModeAsync(
            graphResult.Graph,
            parsedMode.DiagramMode,
            parsedMode.CompileOptions,
            includeNeverShowArmTypes,
            cancellationToken);
    }

    private async Task<InfraEvidenceInventoryLayoutResult> TryRenderInventoryLayoutAsync(
        MermaidDiagramRenderResult renderResult,
        CancellationToken cancellationToken)
    {
        if (renderResult.RepairedAst is null)
        {
            return InfraEvidenceInventoryLayoutResult.MermaidDagreFallback;
        }

        if (renderResult.Status is not MermaidDiagramRenderStatus.Succeeded
            and not MermaidDiagramRenderStatus.Partitioned)
        {
            return InfraEvidenceInventoryLayoutResult.MermaidDagreFallback;
        }

        DiagramForestLayoutResult forestResult = _forestLayoutSvgRenderer.Render(renderResult.RepairedAst);

        if (forestResult.Succeeded && !string.IsNullOrWhiteSpace(forestResult.Svg))
        {
            SvgDiagramSanitizeResult sanitized = SvgDiagramSanitizer.Sanitize(forestResult.Svg);

            if (!string.IsNullOrWhiteSpace(sanitized.SanitizedContent))
            {
                return new InfraEvidenceInventoryLayoutResult
                {
                    LayoutSvg = sanitized.SanitizedContent,
                    LayoutEngine = "inventory-forest",
                    RepairedAst = renderResult.RepairedAst,
                };
            }
        }

        string dot = _graphvizDotEmitter.Emit(renderResult.RepairedAst);
        GraphvizLayoutRenderResult graphvizResult = await _graphvizLayoutRenderer.RenderSvgAsync(dot, cancellationToken);

        if (!graphvizResult.Succeeded || string.IsNullOrWhiteSpace(graphvizResult.Svg))
        {
            return InfraEvidenceInventoryLayoutResult.MermaidDagreFallback;
        }

        return new InfraEvidenceInventoryLayoutResult
        {
            LayoutSvg = graphvizResult.Svg,
            LayoutEngine = "graphviz-fdp",
            RepairedAst = renderResult.RepairedAst,
        };
    }

    private InfraEvidenceMermaidRenderResponse MapRenderResponse(
        Guid snapshotId,
        string modeKey,
        string? fallbackKey,
        MermaidDiagramRenderResult renderResult,
        GraphSnapshot? sourceGraph = null,
        InfraEvidenceInventoryLayoutResult? layoutResult = null)
    {
        bool includeMermaid = renderResult.Status == MermaidDiagramRenderStatus.Succeeded
            || renderResult.Status == MermaidDiagramRenderStatus.Partitioned;

        List<InfraEvidenceMermaidFallbackArtifactSummary> fallbackArtifacts =
            MapFallbackSummaries(renderResult.FallbackArtifacts);

        if (sourceGraph is not null
            && (string.Equals(modeKey, InventoryDiagramFallbackArtifactKeys.ResourceGroupModeKey, StringComparison.OrdinalIgnoreCase)
                || modeKey.StartsWith(InventoryDiagramFallbackArtifactKeys.ResourceGroupKeyPrefix, StringComparison.OrdinalIgnoreCase)))
        {
            fallbackArtifacts = MapFallbackSummaries(
                _fallbackSetBuilder.BuildResourceGroupFallbackSet(sourceGraph, _thresholds));
        }

        InfraEvidenceInventoryLayoutResult resolvedLayout = layoutResult ?? InfraEvidenceInventoryLayoutResult.MermaidDagreFallback;

        return new InfraEvidenceMermaidRenderResponse
        {
            SnapshotId = snapshotId,
            Mode = modeKey,
            FallbackKey = fallbackKey,
            Status = renderResult.Status.ToString(),
            Mermaid = InfraEvidenceMermaidResponseContent.SelectMermaidForClient(
                includeMermaid,
                renderResult.PrimaryMermaid,
                renderResult.Metrics),
            Metrics = MapMetrics(renderResult.Metrics),
            FallbackArtifacts = fallbackArtifacts,
            LayoutSvg = resolvedLayout.LayoutSvg,
            LayoutEngine = resolvedLayout.LayoutEngine,
            CollapseReport = MapCollapseReport(renderResult.CollapseReport),
        };
    }

    private static InfraEvidenceMermaidCollapseReport? MapCollapseReport(
        MermaidDiagramCollapseReport? collapseReport)
    {
        if (collapseReport is null || collapseReport.Entries.Count == 0)
        {
            return null;
        }

        List<InfraEvidenceMermaidCollapseEntry> entries = [];

        foreach (MermaidDiagramCollapseEntry entry in collapseReport.Entries)
        {
            entries.Add(new InfraEvidenceMermaidCollapseEntry
            {
                Kind = entry.Kind,
                CloudResourceId = entry.CloudResourceId,
                NodeId = entry.NodeId,
                Reason = entry.Reason,
            });
        }

        return new InfraEvidenceMermaidCollapseReport { Entries = entries };
    }

    private static List<InfraEvidenceMermaidFallbackArtifactSummary> MapFallbackSummaries(
        IReadOnlyList<MermaidDiagramRenderArtifact> artifacts)
    {
        List<InfraEvidenceMermaidFallbackArtifactSummary> summaries = [];

        foreach (MermaidDiagramRenderArtifact artifact in artifacts)
        {
            if (InventoryDiagramFallbackArtifactKeys.IsFullMachine(artifact.Key))
            {
                continue;
            }

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
