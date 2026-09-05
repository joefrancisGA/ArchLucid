// Context-ingestion and knowledge-graph composition registrations (extracted from PipelineCompositionModule).

using ArchLucid.Core.Configuration;
using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Services;
using ArchLucid.ContextIngestion.Summaries;
using ArchLucid.ContextIngestion.Topology;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Services;
using ArchLucid.Persistence.Coordination.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using ContextConnector = ArchLucid.ContextIngestion.Interfaces.IContextConnector;
using ContextIngestionService = ArchLucid.Contracts.Persistence.Ports.IContextIngestionService;
using GraphBuilder = ArchLucid.KnowledgeGraph.Interfaces.IGraphBuilder;
using KnowledgeGraphLimitsOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphLimitsOptions;
using KnowledgeGraphProjectionCacheOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphProjectionCacheOptions;
using KnowledgeGraphService = ArchLucid.Core.Persistence.Ports.IKnowledgeGraphService;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Context connectors, canonicalization pipeline, and knowledge-graph service registrations.
/// </summary>
internal static class ContextIngestionCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<KnowledgeGraphLimitsOptions>(
            configuration.GetSection(KnowledgeGraphLimitsOptions.SectionName));
        services.Configure<KnowledgeGraphProjectionCacheOptions>(
            configuration.GetSection(KnowledgeGraphProjectionCacheOptions.SectionName));
        services.AddSingleton<IValidateOptions<KnowledgeGraphProjectionCacheOptions>, KnowledgeGraphProjectionCacheOptionsValidator>();
        services.TryAddSingleton<IMemoryCache>(_ => new MemoryCache(new MemoryCacheOptions { SizeLimit = 1000 }));
        services.TryAddSingleton<IGraphProjectionCacheInvalidationBroadcaster>(
            NullGraphProjectionCacheInvalidationBroadcaster.Instance);
        services.TryAddSingleton<IGraphSnapshotProjectionCache>(static sp =>
        {
            IConfiguration configuration = sp.GetRequiredService<IConfiguration>();
            IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> monitor =
                sp.GetRequiredService<IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>>();
            KnowledgeGraphProjectionCacheOptions opts = monitor.CurrentValue;

            if (!opts.Enabled)
                return NonCachingGraphSnapshotProjectionCache.Instance;

            HotPathCacheOptions hotPath =
                configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>()
                ?? new HotPathCacheOptions();

            bool redisConfigured = !string.IsNullOrWhiteSpace(opts.RedisConnectionString)
                || !string.IsNullOrWhiteSpace(configuration["HotPathCache:RedisConnectionString"])
                || !string.IsNullOrWhiteSpace(configuration["LlmCompletionCache:RedisConnectionString"]);

            GraphProjectionCacheBackend effectiveBackend = GraphProjectionCacheProviderResolver.ResolveEffectiveBackend(
                opts,
                hotPath.ExpectedApiReplicaCount,
                redisConfigured);

            if (effectiveBackend == GraphProjectionCacheBackend.Distributed)
            {
                IDistributedCache distributedCache = sp.GetRequiredService<IDistributedCache>();
                IGraphProjectionCacheInvalidationBroadcaster broadcaster =
                    sp.GetRequiredService<IGraphProjectionCacheInvalidationBroadcaster>();

                return new GraphSnapshotProjectionDistributedCache(distributedCache, monitor, broadcaster);
            }

            IMemoryCache memoryCache = sp.GetRequiredService<IMemoryCache>();

            return new GraphSnapshotProjectionMemoryCache(memoryCache, monitor);
        });
        services.AddSingleton<PlainTextContextDocumentParser>();
        services.AddSingleton<IContextDocumentParser>(static sp => sp.GetRequiredService<PlainTextContextDocumentParser>());
        services.AddSingleton<IReadOnlyList<IContextDocumentParser>>(static sp =>
            ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers(sp));

        services.AddSingleton<IInfrastructureDeclarationParser, JsonInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, SimpleTerraformDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, TerraformShowJsonInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, BicepInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, ArmJsonInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, KubernetesJsonInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, KubernetesYamlInfrastructureDeclarationParser>();

        services.AddSingleton<IDiagramSourceParser, MermaidDiagramSourceParser>();
        services.AddSingleton<IDiagramSourceParser, ArchLucidDiagramJsonParser>();
        services.AddSingleton<IDiagramSourceParser, DrawIoXmlDiagramSourceParser>();
        services.AddSingleton<IDiagramSourceParser, SvgDiagramSourceParser>();
        services.AddSingleton<SimulatorVisionDiagramInterpreter>();
        services.AddSingleton<StructuredDiagramParseRouter>();

        // Typed connector stages (Phase 1 — composable extract + normalize; connectors remain IContextConnector facades).
        services.AddSingleton<IConnectorInput<StaticRequestPayload>, StaticRequestPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<StaticRequestPayload>, StaticRequestPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<InlineRequirementsPayload>, InlineRequirementsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<InlineRequirementsPayload>, InlineRequirementsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<DocumentConnectorPayload>, DocumentConnectorPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<DocumentConnectorPayload>, DocumentConnectorPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<PolicyReferencePayload>, PolicyReferencePayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<PolicyReferencePayload>, PolicyReferencePayloadNormalizer>();
        services.AddSingleton<IPolicyTopologyOverlapResolver, PolicyTopologyOverlapResolver>();
        services.AddSingleton<IConnectorInput<TopologyHintsPayload>, TopologyHintsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<TopologyHintsPayload>, TopologyHintsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<SecurityBaselineHintsPayload>, SecurityBaselineHintsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<SecurityBaselineHintsPayload>, SecurityBaselineHintsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<InfrastructureDeclarationsPayload>, InfrastructureDeclarationsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<InfrastructureDeclarationsPayload>,
            InfrastructureDeclarationsPayloadNormalizer>();

        // Concrete connectors (registered once each). Order here matches pipeline order for readability only;
        // execution order is defined solely in ContextConnectorPipeline.CreateOrderedConnectorDescriptors /
        // CreateOrderedContextConnectorPipeline.
        services.AddSingleton<StaticRequestContextConnector>();
        services.AddSingleton<InlineRequirementsConnector>();
        services.AddSingleton<DocumentConnector>();
        services.AddSingleton<PolicyReferenceConnector>();
        services.AddSingleton<TopologyHintsConnector>();
        services.AddSingleton<SecurityBaselineHintsConnector>();
        services.AddSingleton<InfrastructureDeclarationConnector>();

        // Ordered pipeline slots (Phase 2); IEnumerable<IContextConnector> below is a projection for legacy resolves.
        services.AddSingleton<IReadOnlyList<IConnectorDescriptor>>(static sp =>
            ContextConnectorPipeline.CreateOrderedConnectorDescriptors(sp));
        services.AddSingleton<IConnectorPipelineOrchestrator, DefaultConnectorPipelineOrchestrator>();

        // IEnumerable<IContextConnector> must come only from CreateOrderedContextConnectorPipeline — preserves
        // deterministic DeltaSummary segment order and operator-facing narrative (see docs/CONTEXT_INGESTION.md).
        services.AddSingleton<IEnumerable<ContextConnector>>(static sp =>
            ContextConnectorPipeline.CreateOrderedContextConnectorPipeline(sp));

        services.AddSingleton<TopologyResourceCanonicalEnricher>();
        services.AddSingleton<SecurityBaselineCanonicalEnricher>();
        services.AddSingleton<TerraformRuntimePlatformCanonicalEnricher>();
        services.AddSingleton<ICanonicalEnricher>(static sp =>
            new CompositeCanonicalEnricher(
            [
                sp.GetRequiredService<TopologyResourceCanonicalEnricher>(),
                sp.GetRequiredService<SecurityBaselineCanonicalEnricher>(),
                sp.GetRequiredService<TerraformRuntimePlatformCanonicalEnricher>(),
            ]));
        services.AddSingleton<ICanonicalDeduplicator, CanonicalDeduplicator>();
        services.AddSingleton<IContextDeltaSummaryBuilder, DefaultContextDeltaSummaryBuilder>();
        services.AddSingleton<IConnectorDeltaComputer, SetDiffConnectorDeltaComputer>();

        services.AddScoped<ContextIngestionService, ArchLucid.ContextIngestion.Services.ContextIngestionService>();
        services.AddScoped<IGraphNodeFactory, GraphNodeFactory>();
        services.AddScoped<IGraphEdgeInferer, DefaultGraphEdgeInferer>();
        services.AddSingleton<IGraphValidator, GraphValidator>();
        services.AddScoped<GraphBuilder, KnowledgeGraph.Builders.DefaultGraphBuilder>();
        services.AddScoped<KnowledgeGraphService, ArchLucid.KnowledgeGraph.Services.KnowledgeGraphService>();
        services.AddScoped<ArchLucid.KnowledgeGraph.Interfaces.IArchitectureKnowledgeModelGraphProjector,
            ArchLucid.KnowledgeGraph.Projection.ArchitectureKnowledgeModelGraphProjector>();
    }
}
