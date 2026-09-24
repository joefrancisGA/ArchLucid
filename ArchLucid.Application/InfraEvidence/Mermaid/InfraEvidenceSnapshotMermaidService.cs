using ArchLucid.Application.Graphviz;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.AzureExtractor;
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
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;
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
        ("businessContinuity", DiagramMode.BusinessContinuity),
        ("identity", DiagramMode.Identity),
        ("data", DiagramMode.Data),
        ("dataFlow", DiagramMode.DataFlow),
        ("dataArchitecture", DiagramMode.DataArchitecture),
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
        bool includeNeverShowArmTypes = false,
        CancellationToken cancellationToken = default,
        bool includePrivateEndpointNodes = false,
        bool includeRecoveryServices = false)
    {
        ArgumentNullException.ThrowIfNull(scope);

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        AzureInventorySnapshotGraphResolveResult defaultGraphResult =
            await _graphResolver.TryResolveGraphAsync(
                scope,
                snapshotId,
                includeNeverShowArmTypes,
                retainIdentityDiagramArmTypes: false,
                cancellationToken);

        if (!defaultGraphResult.Succeeded || defaultGraphResult.Graph is null)
        {
            return NotFound<InfraEvidenceMermaidPreviewResponse>(
                defaultGraphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
        }

        List<InfraEvidenceMermaidModePreview> modePreviews = [];

        foreach ((string modeKey, DiagramMode diagramMode) in PreviewModes)
        {
            GraphSnapshot graph = defaultGraphResult.Graph;

            if (ShouldRetainIdentityDiagramArmTypes(diagramMode, includeNeverShowArmTypes))
            {
                AzureInventorySnapshotGraphResolveResult identityGraphResult =
                    await _graphResolver.TryResolveGraphAsync(
                        scope,
                        snapshotId,
                        includeNeverShowArmTypes,
                        retainIdentityDiagramArmTypes: true,
                        cancellationToken);

                if (identityGraphResult.Succeeded && identityGraphResult.Graph is not null)
                {
                    graph = identityGraphResult.Graph;
                }
            }

            InfraEvidenceMermaidModePreview modePreview = await TryRenderModePreviewAsync(
                graph,
                modeKey,
                diagramMode,
                null,
                includeNeverShowArmTypes,
                includePrivateEndpointNodes
                    ? new DiagramAstCompileOptions { IncludePrivateEndpointNodes = true }
                    : null,
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
                CompletenessWarnings = ResolveCompletenessWarnings(defaultGraphResult.Snapshot),
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
        CancellationToken cancellationToken = default,
        bool includePrivateEndpointNodes = false,
        bool includeRecoveryServices = false)
    {
        ArgumentNullException.ThrowIfNull(scope);

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(fallbackKey))
        {
            AzureInventorySnapshotGraphResolveResult fallbackGraphResult =
                await _graphResolver.TryResolveGraphAsync(
                    scope,
                    snapshotId,
                    includeNeverShowArmTypes,
                    retainIdentityDiagramArmTypes: false,
                    cancellationToken);

            if (!fallbackGraphResult.Succeeded || fallbackGraphResult.Graph is null)
            {
                return NotFound<InfraEvidenceMermaidRenderResponse>(
                    fallbackGraphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
            }

            return await RenderFallbackAsync(
                snapshotId,
                fallbackGraphResult.Graph,
                fallbackKey,
                includeNeverShowArmTypes,
                cancellationToken);
        }

        if (!InfraEvidenceMermaidModeParser.TryParse(
                mode,
                seedNodeId,
                hiddenExecutiveTierKeys,
                out InfraEvidenceMermaidModeParseResult parsedMode,
                includePrivateEndpointNodes,
                includeRecoveryServices))
        {
            return BadRequest<InfraEvidenceMermaidRenderResponse>(parsedMode.ErrorMessage ?? "Invalid mode.");
        }

        bool retainIdentityDiagramArmTypes = ShouldRetainIdentityDiagramArmTypes(
            parsedMode.DiagramMode,
            includeNeverShowArmTypes);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(
                scope,
                snapshotId,
                includeNeverShowArmTypes,
                retainIdentityDiagramArmTypes,
                cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
        {
            return NotFound<InfraEvidenceMermaidRenderResponse>(
                graphResult.ErrorMessage ?? $"Snapshot '{snapshotId}' was not found.");
        }

        if (parsedMode.DiagramMode == DiagramMode.ResourceGroup
            && string.IsNullOrWhiteSpace(parsedMode.CompileOptions?.ResourceGroupName))
        {
            return CreateResourceGroupPickerResponse(snapshotId, graphResult.Graph);
        }

        DiagramAstCompileOptions? compileOptions = MergeRecoveryServicesCompileOptions(
            parsedMode.CompileOptions,
            graphResult.Snapshot,
            includeRecoveryServices);

        InfraEvidenceMermaidRenderResponse renderResponse = await TryRenderModeResponseAsync(
            snapshotId,
            parsedMode.ModeKey,
            null,
            graphResult.Graph,
            parsedMode.DiagramMode,
            compileOptions,
            includeNeverShowArmTypes,
            graphResult.Snapshot,
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
        CancellationToken cancellationToken = default,
        bool includePrivateEndpointNodes = false,
        bool includeRecoveryServices = false)
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
                cancellationToken,
                includePrivateEndpointNodes,
                includeRecoveryServices);

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
        bool includeNeverShowArmTypes,
        DiagramAstCompileOptions? displayOptions,
        CancellationToken cancellationToken)
    {
        try
        {
            MermaidDiagramRenderResult renderResult = await RenderModeAsync(
                graph,
                diagramMode,
                displayOptions ?? compileOptions,
                includeNeverShowArmTypes,
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
        AzureInventorySnapshotDetailReadModel? snapshot,
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

            return MapRenderResponse(
                snapshotId,
                modeKey,
                fallbackKey,
                renderResult,
                graph,
                layoutResult,
                snapshot);
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

        bool retainIdentityDiagramArmTypes = ShouldRetainIdentityDiagramArmTypes(
            parsedMode.DiagramMode,
            includeNeverShowArmTypes);

        AzureInventorySnapshotGraphResolveResult graphResult =
            await _graphResolver.TryResolveGraphAsync(
                scope,
                snapshotId,
                includeNeverShowArmTypes,
                retainIdentityDiagramArmTypes,
                cancellationToken);

        if (!graphResult.Succeeded || graphResult.Graph is null)
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

    private static bool ShouldRetainIdentityDiagramArmTypes(DiagramMode diagramMode, bool includeNeverShowArmTypes)
    {
        return diagramMode == DiagramMode.Identity && !includeNeverShowArmTypes;
    }

    private static InfraEvidenceMermaidIdentityDiagramHints? MapIdentityDiagramHints(
        string modeKey,
        AzureInventorySnapshotDetailReadModel? snapshot)
    {
        if (!string.Equals(modeKey, InventoryDiagramFallbackArtifactKeys.Identity, StringComparison.OrdinalIgnoreCase)
            || snapshot is null)
        {
            return null;
        }

        IReadOnlyList<AzureInventoryIdentityDiagramSuppressedArmTypeSummary> suppressedArmTypes =
            AzureInventoryIdentityDiagramVisibility.ListInventoryFilteredIdentityArmTypes(snapshot.Resources);

        if (suppressedArmTypes.Count == 0)
        {
            return null;
        }

        return new InfraEvidenceMermaidIdentityDiagramHints
        {
            InventoryFilteredIdentityArmTypes = suppressedArmTypes
                .Select(summary => new InfraEvidenceMermaidIdentityDiagramSuppressedArmType
                {
                    ArmResourceType = summary.ArmResourceType,
                    ResourceCount = summary.ResourceCount,
                })
                .ToList(),
        };
    }

    private InfraEvidenceMermaidRenderResponse MapRenderResponse(
        Guid snapshotId,
        string modeKey,
        string? fallbackKey,
        MermaidDiagramRenderResult renderResult,
        GraphSnapshot? sourceGraph = null,
        InfraEvidenceInventoryLayoutResult? layoutResult = null,
        AzureInventorySnapshotDetailReadModel? snapshot = null)
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
            IdentityDiagramHints = MapIdentityDiagramHints(modeKey, snapshot),
            CompletenessWarnings = ResolveCompletenessWarnings(snapshot),
            CompletenessSummary = BuildCompletenessSummary(modeKey, sourceGraph, snapshot),
        };
    }

    private static InfraEvidenceMermaidCompletenessSummary? BuildCompletenessSummary(
        string modeKey,
        GraphSnapshot? graph,
        AzureInventorySnapshotDetailReadModel? snapshot)
    {
        if (graph is null)
        {
            return null;
        }

        List<GraphEdge> visibleEdges = graph.Edges
            .Where(edge => edge.Weight >= 0.5d)
            .ToList();
        HashSet<string> collectedClasses = visibleEdges
            .Select(edge => edge.InferenceSource ?? edge.EdgeType)
            .Where(source => !string.IsNullOrWhiteSpace(source))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        int hiddenHopCount = visibleEdges.Count(edge =>
            edge.InferenceSource is not null
            && (edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
                || edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
                || edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)));
        int collocationCount = visibleEdges.Count(edge =>
            string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                StringComparison.OrdinalIgnoreCase));

        return new InfraEvidenceMermaidCompletenessSummary
        {
            Mode = modeKey,
            VisibleNodeCount = graph.Nodes.Count,
            VisibleEdgeCount = visibleEdges.Count,
            ConnectedComponentCount = CountConnectedComponents(graph.Nodes, visibleEdges),
            HiddenHopsUsedCount = hiddenHopCount,
            LikelyInCollocationEdgeCount = collocationCount,
            CollectedClasses = collectedClasses.Order(StringComparer.Ordinal).ToList(),
            MissingClasses = ResolveCompletenessWarnings(snapshot)
                .Where(warning => warning.Contains("missing", StringComparison.OrdinalIgnoreCase))
                .ToList(),
        };
    }

    private static int CountConnectedComponents(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
    {
        Dictionary<string, List<string>> adjacency = nodes.ToDictionary(
            node => node.NodeId,
            _ => new List<string>(),
            StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if (adjacency.TryGetValue(edge.FromNodeId, out List<string>? from)
                && adjacency.TryGetValue(edge.ToNodeId, out List<string>? to))
            {
                from.Add(edge.ToNodeId);
                to.Add(edge.FromNodeId);
            }
        }

        HashSet<string> visited = new(StringComparer.Ordinal);
        int components = 0;

        foreach (string nodeId in adjacency.Keys)
        {
            if (!visited.Add(nodeId))
            {
                continue;
            }

            components++;
            Queue<string> queue = new();
            queue.Enqueue(nodeId);

            while (queue.Count > 0)
            {
                string current = queue.Dequeue();

                foreach (string neighbor in adjacency[current])
                {
                    if (visited.Add(neighbor))
                    {
                        queue.Enqueue(neighbor);
                    }
                }
            }
        }

        return components;
    }

    private static List<string> ResolveCompletenessWarnings(AzureInventorySnapshotDetailReadModel? snapshot)
    {
        if (snapshot?.Header is null)
        {
            return [];
        }

        return AzureInventorySnapshotCompletenessWarningsJson
            .Deserialize(snapshot.Header.CompletenessWarningsJson)
            .ToList();
    }

    private static DiagramAstCompileOptions? MergeRecoveryServicesCompileOptions(
        DiagramAstCompileOptions? options,
        AzureInventorySnapshotDetailReadModel? snapshot,
        bool includeRecoveryServices)
    {
        bool collectionIncomplete = HasRecoveryServicesCollectionGap(snapshot);

        if (!includeRecoveryServices && !collectionIncomplete)
        {
            return options;
        }

        return new DiagramAstCompileOptions
        {
            ResourceGroupName = options?.ResourceGroupName,
            SelectedNodeIds = options?.SelectedNodeIds,
            NeighborhoodSeedNodeId = options?.NeighborhoodSeedNodeId,
            NeighborhoodDepth = options?.NeighborhoodDepth ?? 2,
            CollapseToResourceGroupMap = options?.CollapseToResourceGroupMap ?? false,
            CollapseToBackboneKeep = options?.CollapseToBackboneKeep ?? false,
            HiddenExecutiveTierKeys = options?.HiddenExecutiveTierKeys,
            IncludePrivateEndpointNodes = options?.IncludePrivateEndpointNodes ?? false,
            IncludeRecoveryServices = includeRecoveryServices,
            RecoveryServicesCollectionIncomplete = collectionIncomplete,
        };
    }

    private static bool HasRecoveryServicesCollectionGap(AzureInventorySnapshotDetailReadModel? snapshot)
    {
        foreach (string warning in ResolveCompletenessWarnings(snapshot))
        {
            if (warning.StartsWith(
                    AzureInventoryRecoveryServicesCompletenessWarningCodes.BackupListFailedPrefix,
                    StringComparison.OrdinalIgnoreCase)
                || warning.StartsWith(
                    AzureInventoryRecoveryServicesCompletenessWarningCodes.SiteRecoveryListFailedPrefix,
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
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
