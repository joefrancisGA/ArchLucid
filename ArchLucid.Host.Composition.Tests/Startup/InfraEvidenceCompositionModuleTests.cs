using System.Reflection;

using ArchLucid.Application.Graphviz;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Application.InfraEvidence.RemediationPatterns;
using ArchLucid.Application.InfraEvidence.RemediationMetrics;
using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Application.InfraEvidence.SecurityCrosswalk;
using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Composition.Tests;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Diagrams;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Startup;

/// <summary>
///     Pins <see cref="InfraEvidenceCompositionModule" /> registrations and InMemory host wiring for cloud-resource hub services.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InfraEvidenceCompositionModuleTests
{
    [Fact]
    public void InfraEvidenceCompositionModule_registers_cloud_resource_and_audit_evidence_services()
    {
        ServiceCollection services = [];
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());

        services.Should().Contain(static d => d.ServiceType == typeof(ICloudResourceEvidenceHubService));
        services.Should().Contain(static d => d.ServiceType == typeof(ICloudResourceExplorerQueryService));
        services.Should().Contain(static d => d.ServiceType == typeof(IAuditEvidenceSelectorRegistry));
        services.Should().Contain(static d => d.ServiceType == typeof(ITenantBrandingCacheInvalidator));
        services.Should().Contain(static d => d.ServiceType == typeof(ISecurityCrosswalkService));
        services.Should().Contain(static d => d.ServiceType == typeof(MermaidDiagramReadabilityThresholds));
        services.Should().Contain(static d => d.ServiceType == typeof(IAzureInventorySnapshotDeleteService));
        services.Should().Contain(static d => d.ServiceType == typeof(IGraphvizLayoutRenderer));
        services.Should().Contain(static d => d.ServiceType == typeof(IDiagramPeelCatalogProvider));
    }

    [Fact]
    public void RepositoryDiagramPeelCatalogProvider_validates_with_scoped_repository()
    {
        ServiceCollection services = [];
        services.AddMemoryCache();
        services.AddScoped<IDiagramPeelCatalogRepository, InMemoryDiagramPeelCatalogRepository>();
        services.AddSingleton<IDiagramPeelCatalogProvider, RepositoryDiagramPeelCatalogProvider>();

        using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        IDiagramPeelCatalogProvider peelCatalogProvider =
            provider.GetRequiredService<IDiagramPeelCatalogProvider>();

        peelCatalogProvider.Should().BeOfType<RepositoryDiagramPeelCatalogProvider>();
    }

    [Fact]
    public async Task RepositoryDiagramPeelCatalogProvider_loads_catalog_via_scoped_repository()
    {
        ServiceCollection services = [];
        services.AddMemoryCache();
        services.AddScoped<IDiagramPeelCatalogRepository, InMemoryDiagramPeelCatalogRepository>();
        services.AddSingleton<IDiagramPeelCatalogProvider, RepositoryDiagramPeelCatalogProvider>();

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        IDiagramPeelCatalogProvider peelCatalogProvider =
            provider.GetRequiredService<IDiagramPeelCatalogProvider>();

        Contracts.InfraEvidence.DiagramPeel.DiagramPeelCatalogSnapshot snapshot =
            await peelCatalogProvider.GetCatalogAsync(CancellationToken.None);

        snapshot.Entries.Should().NotBeEmpty();
    }

    [Fact]
    public void InfraEvidenceCompositionModule_wires_mermaid_readability_thresholds_singleton_into_snapshot_mermaid_service()
    {
        ServiceCollection services = [];
        MermaidDiagramReadabilityThresholds registeredThresholds = new() { MaxNodes = 4242 };
        services.AddSingleton(registeredThresholds);
        services.AddScoped<IInfraEvidenceSnapshotMermaidService, InfraEvidenceSnapshotMermaidService>();
        RegisterInfraEvidenceSnapshotMermaidServiceTestDoubles(services);

        using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope scope = provider.CreateScope();
        MermaidDiagramReadabilityThresholds resolvedThresholds =
            scope.ServiceProvider.GetRequiredService<MermaidDiagramReadabilityThresholds>();
        InfraEvidenceSnapshotMermaidService mermaidService =
            (InfraEvidenceSnapshotMermaidService)scope.ServiceProvider.GetRequiredService<IInfraEvidenceSnapshotMermaidService>();

        ReferenceEquals(resolvedThresholds, registeredThresholds).Should().BeTrue();

        MermaidDiagramReadabilityThresholds injectedThresholds = ReadMermaidReadabilityThresholds(mermaidService);

        ReferenceEquals(injectedThresholds, registeredThresholds).Should().BeTrue(
            "optional ctor parameter must receive the registered thresholds singleton instead of a fresh default instance");
    }

    [Fact]
    public async Task InMemory_composition_resolves_security_crosswalk_service()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ISecurityCrosswalkService crosswalkService =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityCrosswalkService>();

        crosswalkService.Should().BeOfType<SecurityCrosswalkService>();
    }

    [Fact]
    public async Task InMemory_composition_audit_evaluation_finding_handoff_succeeds_with_noop_finding_repository()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditEvaluationFindingHandoffService handoffService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditEvaluationFindingHandoffService>();

        bool handedOff = await handoffService.TryHandoffAsync(
            new AuditEvaluationFindingHandoffRequest
            {
                TenantId = scope.TenantId,
                AssessmentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ControlId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                InventoryDiffId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                AuditEvidenceSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                SourceSystem = "auditContinuousReadiness",
                Summary = "Control drift requires attention.",
            },
            CancellationToken.None);

        handedOff.Should().BeTrue(
            "InMemory uses NoOpOperationalSecurityFindingRepository; real handoff still reports success for local hosts");
    }

    [Fact]
    public async Task InMemory_composition_resolves_tenant_branding_cache_after_platform_pipeline_registers_memory_cache()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        TenantBrandingResolvedProfileCache brandingCache =
            serviceScope.ServiceProvider.GetRequiredService<TenantBrandingResolvedProfileCache>();
        IMemoryCache memoryCache = serviceScope.ServiceProvider.GetRequiredService<IMemoryCache>();

        Guid tenantId = scope.TenantId;
        ResolvedTenantBrandingProfile profile = new()
        {
            TenantId = tenantId,
            CompanyDisplayName = "Acme Corp",
            IsProductBrand = false,
        };

        brandingCache.Set(tenantId, profile);

        brandingCache.TryGet(tenantId, out ResolvedTenantBrandingProfile? cached).Should().BeTrue();
        cached.Should().BeEquivalentTo(profile);
        memoryCache.Should().NotBeNull("Authority pipeline registers IMemoryCache before InfraEvidence branding cache");
    }

    [Fact]
    public void InfraEvidenceCompositionModule_repeated_register_last_mermaid_thresholds_singleton_wins()
    {
        ServiceCollection services = [];
        MermaidDiagramReadabilityThresholds hostConfigured = new() { MaxNodes = 4242 };
        services.AddSingleton(hostConfigured);
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());

        using ServiceProvider provider = services.BuildServiceProvider();
        MermaidDiagramReadabilityThresholds resolved =
            provider.GetRequiredService<MermaidDiagramReadabilityThresholds>();

        resolved.MaxNodes.Should().Be(400,
            "MS DI last-wins singleton registration; repeated Register() supplies default thresholds, not an earlier host override");
        resolved.Should().NotBeSameAs(hostConfigured);
    }

    [Fact]
    public void InfraEvidenceCompositionModule_repeated_register_keeps_single_selector_descriptor_per_evidence_type()
    {
        ServiceCollection services = [];
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());

        int inventorySelectorRegistrations = services.Count(
            static descriptor => descriptor.ServiceType == typeof(InventoryAuditEvidenceSelector));

        inventorySelectorRegistrations.Should().Be(2,
            "repeated Register duplicates scoped selector descriptors, but registry wiring stays typed");

        using ServiceProvider provider = services.BuildServiceProvider();
        using IServiceScope scope = provider.CreateScope();
        IAuditEvidenceSelectorRegistry registry =
            scope.ServiceProvider.GetRequiredService<IAuditEvidenceSelectorRegistry>();

        registry.ListDescriptors().Should().HaveCount(9,
            "AuditEvidenceSelectorRegistry injects one instance per selector type; collection does not enumerate IEnumerable<IAuditEvidenceSelector>");
    }

    [Fact]
    public async Task InMemory_composition_infra_evidence_peel_catalog_provider_wins_over_artifact_default()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IDiagramPeelCatalogProvider peelCatalogProvider =
            serviceScope.ServiceProvider.GetRequiredService<IDiagramPeelCatalogProvider>();

        peelCatalogProvider.Should().BeOfType<RepositoryDiagramPeelCatalogProvider>(
            "AddInfraEvidenceCapability registers after Authority coordinator artifacts and last-wins the peel catalog provider");
    }

    [Fact]
    public async Task InMemory_composition_resolves_snapshot_delete_and_graphviz_from_module()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAzureInventorySnapshotDeleteService deleteService =
            serviceScope.ServiceProvider.GetRequiredService<IAzureInventorySnapshotDeleteService>();
        IGraphvizLayoutRenderer graphvizRenderer =
            serviceScope.ServiceProvider.GetRequiredService<IGraphvizLayoutRenderer>();

        deleteService.Should().BeOfType<AzureInventorySnapshotDeleteService>();
        graphvizRenderer.Should().BeOfType<GraphvizFdpLayoutRenderer>();
    }

    [Fact]
    public async Task InMemory_composition_cloud_resource_hub_resolves_upserted_identity()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ICloudResourceIdentityDirectory identityDirectory =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceIdentityDirectory>();
        ICloudResourceEvidenceHubService hubService =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceEvidenceHubService>();

        Guid snapshotId = Guid.NewGuid();
        const string externalResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1";

        CloudResourceIdentityRecord upserted = await identityDirectory.UpsertOnSnapshotAsync(
            scope,
            CloudProvider.Azure,
            externalResourceId,
            snapshotId,
            resourceType: "Microsoft.Compute/virtualMachines",
            subscriptionOrAccountId: "sub",
            resourceGroupOrProject: "rg",
            region: "eastus",
            displayName: "vm-1",
            CancellationToken.None);

        CloudResourceEvidenceHubQueryResult result = await hubService.TryGetHubAsync(
            scope,
            upserted.CloudResourceId,
            new CloudResourceEvidenceHubQuery { SnapshotId = snapshotId },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue(result.ErrorMessage);
        result.Hub.Should().NotBeNull();
        result.Hub!.CloudResourceId.Should().Be(upserted.CloudResourceId);
    }

    [Fact]
    public void InfraEvidenceCompositionModule_repeated_register_duplicates_diff_consumer_descriptors()
    {
        ServiceCollection services = [];
        IConfiguration configuration = new ConfigurationBuilder().Build();
        InfraEvidenceCompositionModule.Register(services, configuration);
        InfraEvidenceCompositionModule.Register(services, configuration);

        int diffConsumerRegistrations = services.Count(
            static descriptor => descriptor.ServiceType == typeof(IAzureInventoryDiffConsumer));

        diffConsumerRegistrations.Should().Be(4,
            "MS DI collects every IAzureInventoryDiffConsumer registration; production calls Register once via AddInfraEvidenceCapability");

        services.Count(static descriptor =>
                descriptor.ServiceType == typeof(IAzureInventoryDiffConsumer)
                && descriptor.ImplementationType == typeof(AuditContinuousReadinessDiffConsumer))
            .Should().Be(2);

        services.Count(static descriptor =>
                descriptor.ServiceType == typeof(IAzureInventoryDiffConsumer)
                && descriptor.ImplementationType == typeof(SecureNowArchitectDiffConsumer))
            .Should().Be(2);
    }

    [Fact]
    public async Task InMemory_composition_resolves_diagram_advisory_services()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        serviceScope.ServiceProvider.GetRequiredService<IStructuredDiagramIngestService>()
            .Should().BeOfType<StructuredDiagramIngestService>();
        serviceScope.ServiceProvider.GetRequiredService<IDiagramInfrastructureReconciliationService>()
            .Should().BeOfType<DiagramInfrastructureReconciliationService>();
        serviceScope.ServiceProvider.GetRequiredService<IInfrastructureDiagramComparisonService>()
            .Should().BeOfType<InfrastructureDiagramComparisonService>();
        serviceScope.ServiceProvider.GetRequiredService<IVisionDiagramIngestService>()
            .Should().BeOfType<VisionDiagramIngestService>();
    }

    [Fact]
    public async Task InMemory_composition_ask_grounding_sparse_identifiers_returns_insufficient_evidence()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IInfraEvidenceAskGroundingService askGroundingService =
            serviceScope.ServiceProvider.GetRequiredService<IInfraEvidenceAskGroundingService>();

        InfraEvidenceAskGroundingResult result = await askGroundingService.TryAnswerAsync(
            scope,
            new InfraEvidenceAskRequest
            {
                Question = "What infrastructure changed in this workspace?",
                UseSimulator = true,
            },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue(result.ErrorMessage);
        result.Response.Should().NotBeNull();
        result.Response!.InsufficientEvidence.Should().BeTrue(
            "collector returns an empty bundle when no CloudResourceId, DiffId, or topic-specific identifiers are supplied");
    }

    [Fact]
    public async Task InMemory_composition_resolves_remediation_factory_workbench_and_brand_asset_blob_store()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        IRemediationFactoryWorkbenchQueryService workbenchQueryService =
            serviceScope.ServiceProvider.GetRequiredService<IRemediationFactoryWorkbenchQueryService>();

        RemediationFactoryWorkbenchSummary summary = await workbenchQueryService.GetSummaryAsync(
            scope,
            CancellationToken.None);

        summary.FactoryMetrics.Should().NotBeNull();
        summary.OpenInstancesByStatus.Should().NotBeNull();
        summary.Waves.Should().NotBeNull();

        serviceScope.ServiceProvider.GetRequiredService<ITenantBrandAssetBlobStore>()
            .Should().BeOfType<NullTenantBrandAssetBlobStore>(
                "OpenAPI-like InMemory hosts disable artifact blob offload; brand uploads fail at WriteAsync with an explicit operator message");

        serviceScope.ServiceProvider.GetRequiredService<IBrandAssetService>()
            .Should().BeOfType<BrandAssetService>();
    }

    [Fact]
    public async Task InMemory_composition_operator_inferred_questionnaire_returns_empty_without_snapshot_detail()
    {
        ScopeContext scope = CreateDefaultScope();
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IOperatorInferredConnectionService operatorInferredService =
            serviceScope.ServiceProvider.GetRequiredService<IOperatorInferredConnectionService>();

        IReadOnlyList<OperatorInferredConnectionRecord> questionnaire =
            await operatorInferredService.ListQuestionnaireBySnapshotAsync(
                scope,
                snapshotId,
                CancellationToken.None);

        questionnaire.Should().BeEmpty(
            "InMemory NoOp repository returns no rows; empty questionnaire is the expected local-host outcome, not a DI failure");
    }

    [Fact]
    public async Task InMemory_composition_resolves_operator_inferred_disposition_lineage_and_hybrid_audit_services()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        serviceScope.ServiceProvider.GetRequiredService<IOperatorInferredConnectionService>()
            .Should().BeOfType<OperatorInferredConnectionService>();
        serviceScope.ServiceProvider.GetRequiredService<IInferenceQuestionnaireItemGenerator>()
            .Should().BeOfType<InferenceQuestionnaireItemGenerator>();
        serviceScope.ServiceProvider.GetRequiredService<ISecureNowQuestionDispositionService>()
            .Should().BeOfType<SecureNowQuestionDispositionService>();
        serviceScope.ServiceProvider.GetRequiredService<ICloudResourceAuditLineageResolver>()
            .Should().BeOfType<CloudResourceAuditLineageResolver>();
        serviceScope.ServiceProvider.GetRequiredService<IAuditHybridEvidenceQueryService>()
            .Should().BeOfType<AuditHybridEvidenceQueryService>();
    }

    [Fact]
    public async Task InMemory_composition_worker_role_validates_infra_evidence_post_materialize_wiring()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        configuration["Hosting:Role"] = "Worker";

        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        serviceScope.ServiceProvider.GetRequiredService<IAzureInventorySnapshotPostMaterializeCoordinator>()
            .Should().BeOfType<AzureInventorySnapshotPostMaterializeCoordinator>();
        serviceScope.ServiceProvider.GetServices<IAzureInventoryDiffConsumer>()
            .Select(consumer => consumer.GetType())
            .Should()
            .Contain(typeof(AuditContinuousReadinessDiffConsumer))
            .And.Contain(typeof(SecureNowArchitectDiffConsumer));
    }

    [Fact]
    public void InfraEvidenceCompositionModule_registers_nine_audit_evidence_selector_implementations()
    {
        ServiceCollection services = [];
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());

        Type[] selectorTypes =
        [
            typeof(InventoryAuditEvidenceSelector),
            typeof(IdentityAuditEvidenceSelector),
            typeof(RbacAuditEvidenceSelector),
            typeof(NetworkAuditEvidenceSelector),
            typeof(DataAuditEvidenceSelector),
            typeof(LoggingAuditEvidenceSelector),
            typeof(GovernanceAuditEvidenceSelector),
            typeof(PostureAuditEvidenceSelector),
            typeof(ResilienceAuditEvidenceSelector),
        ];

        foreach (Type selectorType in selectorTypes)
        {
            services.Should().Contain(
                descriptor => descriptor.ImplementationType == selectorType,
                $"{selectorType.Name} should be registered for audit evidence collection");
        }
    }

    [Fact]
    public void InfraEvidenceCompositionModule_configure_graphviz_options_binds_configuration_section()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["ArchLucid:Graphviz:Enabled"] = "false" })
            .Build();

        ServiceCollection services = [];
        services.AddOptions();
        InfraEvidenceCompositionModule.Register(services, configuration);

        using ServiceProvider provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<GraphvizOptions>>().Value.Enabled.Should().BeFalse();
    }

    [Fact]
    public async Task InMemory_composition_tenant_branding_cache_invalidator_aliases_resolved_profile_cache()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        TenantBrandingResolvedProfileCache brandingCache =
            serviceScope.ServiceProvider.GetRequiredService<TenantBrandingResolvedProfileCache>();
        ITenantBrandingCacheInvalidator invalidator =
            serviceScope.ServiceProvider.GetRequiredService<ITenantBrandingCacheInvalidator>();

        ReferenceEquals(brandingCache, invalidator).Should().BeTrue(
            "module wires ITenantBrandingCacheInvalidator to the same singleton cache instance");
    }

    [Fact]
    public async Task InMemory_composition_resolves_securenow_path_engine_cluster()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        serviceScope.ServiceProvider.GetRequiredService<IPrivilegePathEngine>()
            .Should().BeOfType<PrivilegePathEngine>();
        serviceScope.ServiceProvider.GetRequiredService<IFourRealityDriftEngine>()
            .Should().BeOfType<FourRealityDriftEngine>();
        serviceScope.ServiceProvider.GetRequiredService<ISecureNowArchitectNeighborhoodRunner>()
            .Should().BeOfType<SecureNowArchitectNeighborhoodRunner>();
        serviceScope.ServiceProvider.GetRequiredService<SecureNowArchitectPathCarryForwardService>()
            .Should().NotBeNull();
    }

    [Fact]
    public async Task InMemory_composition_resolves_audit_continuous_readiness_service()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        serviceScope.ServiceProvider.GetRequiredService<IAuditContinuousReadinessService>()
            .Should().BeOfType<AuditContinuousReadinessService>();
        serviceScope.ServiceProvider.GetRequiredService<IOperationalSecurityFindingIngestService>()
            .Should().BeOfType<OperationalSecurityFindingIngestService>();
    }

    [Fact]
    public async Task InMemory_composition_resolves_drift_workbench_path_routing_and_snapshot_graph_boundaries()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();

        IInfraEvidenceDriftWorkbenchQueryService driftWorkbench =
            serviceScope.ServiceProvider.GetRequiredService<IInfraEvidenceDriftWorkbenchQueryService>();

        PagedResponse<AzureInventorySnapshotRecord> snapshots = await driftWorkbench.ListSnapshotsAsync(
            scope,
            page: 1,
            pageSize: 10,
            subscriptionId: null,
            CancellationToken.None);

        snapshots.Items.Should().NotBeNull();
        snapshots.TotalCount.Should().BeGreaterThanOrEqualTo(0);

        IAzureInventorySnapshotGraphResolver graphResolver =
            serviceScope.ServiceProvider.GetRequiredService<IAzureInventorySnapshotGraphResolver>();

        AzureInventorySnapshotGraphResolveResult missingSnapshot = await graphResolver.TryResolveGraphAsync(
            scope,
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            cancellationToken: CancellationToken.None);

        missingSnapshot.Succeeded.Should().BeFalse();
        missingSnapshot.ErrorMessage.Should().Contain("not found");

        ISecurityEvidencePathRoutingSyncService pathRoutingSync =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityEvidencePathRoutingSyncService>();

        await pathRoutingSync.SyncSnapshotAsync(scope, Guid.Empty, CancellationToken.None);

        IBrandedDiagramExportComposer composer =
            serviceScope.ServiceProvider.GetRequiredService<IBrandedDiagramExportComposer>();
        IBrandedDiagramExportService exportService =
            serviceScope.ServiceProvider.GetRequiredService<IBrandedDiagramExportService>();

        composer.Should().BeOfType<BrandedDiagramExportComposer>();
        exportService.Should().BeOfType<BrandedDiagramExportService>();
        composer.DecorateMermaidSource("graph TD\n  A-->B", "Acme").Should().Contain("%% title: Acme");
    }

    [Fact]
    public async Task InMemory_composition_peel_catalog_provider_seeds_on_first_read_without_bootstrapper_host()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IDiagramPeelCatalogProvider peelCatalogProvider =
            serviceScope.ServiceProvider.GetRequiredService<IDiagramPeelCatalogProvider>();

        Contracts.InfraEvidence.DiagramPeel.DiagramPeelCatalogSnapshot snapshot =
            await peelCatalogProvider.GetCatalogAsync(CancellationToken.None);

        snapshot.Entries.Should().NotBeEmpty(
            "RepositoryDiagramPeelCatalogProvider supplies default seed snapshot when repository count is zero; bootstrapper hosted startup is optional");
    }

    [Fact]
    public async Task InMemory_composition_manual_evidence_submit_fails_when_assessment_missing()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditManualEvidenceSubmissionService submissionService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditManualEvidenceSubmissionService>();

        AuditManualEvidenceSubmitResult result = await submissionService.TrySubmitAsync(
            new AuditManualEvidenceSubmitRequest
            {
                AssessmentId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ControlId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                RequirementId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Owner = "owner@example.com",
                Content = "evidence body",
            },
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Assessment not found");
    }

    [Fact]
    public async Task InMemory_composition_remediation_prioritization_and_waves_return_empty_without_data()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IRemediationPrioritizationService prioritizationService =
            serviceScope.ServiceProvider.GetRequiredService<IRemediationPrioritizationService>();
        IRemediationWaveService waveService =
            serviceScope.ServiceProvider.GetRequiredService<IRemediationWaveService>();

        IReadOnlyList<RemediationPrioritizedFinding> ranked = await prioritizationService.RankOpenFindingsAsync(
            scope,
            actorKey: "operator@example.com",
            CancellationToken.None);

        ranked.Should().BeEmpty(
            "InMemory noop finding repositories yield zero open findings; empty ranking is expected local behavior, not a miscomposition unavailable signal");

        IReadOnlyList<RemediationWaveRecord> waves = await waveService.ListWavesAsync(scope, CancellationToken.None);

        waves.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemory_composition_explorer_lists_hub_upserted_cloud_resource_identity()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ICloudResourceIdentityDirectory identityDirectory =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceIdentityDirectory>();
        ICloudResourceExplorerQueryService explorerQueryService =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceExplorerQueryService>();

        Guid snapshotId = Guid.NewGuid();
        const string externalResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        CloudResourceIdentityRecord upserted = await identityDirectory.UpsertOnSnapshotAsync(
            scope,
            CloudProvider.Azure,
            externalResourceId,
            snapshotId,
            resourceType: "Microsoft.Storage/storageAccounts",
            subscriptionOrAccountId: "sub",
            resourceGroupOrProject: "rg",
            region: "eastus",
            displayName: "sa1",
            CancellationToken.None);

        PagedResponse<CloudResourceSummary> explorerPage = await explorerQueryService.ListCloudResourcesAsync(
            scope,
            namePrefix: null,
            resourceType: null,
            resourceGroup: null,
            CloudResourceExplorerWorkQueue.All,
            page: 1,
            pageSize: 50,
            CancellationToken.None);

        explorerPage.Items.Should().ContainSingle();
        explorerPage.Items[0].CloudResourceId.Should().Be(upserted.CloudResourceId);
        explorerPage.Items[0].ExternalResourceId.Should().Be(upserted.ExternalResourceIdNormalized);
    }

    [Fact]
    public async Task InMemory_composition_operational_security_exception_create_succeeds_without_durable_noop_row()
    {
        ScopeContext scope = CreateDefaultScope();
        string rationale = new('x', FindingDispositionValidation.MinimumRationaleLength);
        DateTime utcNow = DateTime.UtcNow;

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IOperationalSecurityExceptionService exceptionService =
            serviceScope.ServiceProvider.GetRequiredService<IOperationalSecurityExceptionService>();
        IOperationalSecurityExceptionRepository exceptionRepository =
            serviceScope.ServiceProvider.GetRequiredService<IOperationalSecurityExceptionRepository>();

        OperationalSecurityExceptionCreateResult createResult = await exceptionService.CreateAsync(
            scope,
            new OperationalSecurityExceptionCreateRequest
            {
                CloudResourceId = Guid.NewGuid(),
                OwnerActorKeys = ["owner-1"],
                Rationale = rationale,
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "requester",
                ApprovedByActorKey = "approver",
            },
            CancellationToken.None);

        createResult.Succeeded.Should().BeTrue();
        createResult.ExceptionId.Should().NotBe(Guid.Empty);

        OperationalSecurityExceptionRecord? stored = await exceptionRepository.TryGetByIdAsync(
            scope.TenantId,
            createResult.ExceptionId!.Value,
            CancellationToken.None);

        stored.Should().BeNull(
            "InMemory NoOpOperationalSecurityExceptionRepository is intentional local durability; API success matches handoff noop pattern");
    }

    [Fact]
    public async Task InMemory_composition_path_inspector_and_rank_queries_use_consistent_empty_shapes()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ISecurityEvidencePathInspectorQueryService inspector =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityEvidencePathInspectorQueryService>();
        ISecurityEvidencePathRankQueryService rankQuery =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityEvidencePathRankQueryService>();

        PagedResponse<SecurityEvidencePathSummaryResponse> list =
            await inspector.ListPathsAsync(scope, snapshotId: null, pathKind: null, confidenceBand: null, cloudResourceId: null, page: 1, pageSize: 10, CancellationToken.None);

        list.Items.Should().BeEmpty();
        list.TotalCount.Should().Be(0);

        SecurityEvidencePathDetailResponse? missingDetail =
            await inspector.TryGetPathDetailAsync(scope, Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), CancellationToken.None);

        missingDetail.Should().BeNull();

        SecurityEvidencePathRankedPageResponse ranked =
            await rankQuery.ListRankedPathsAsync(scope, snapshotId: null, page: 1, pageSize: 10, CancellationToken.None);

        ranked.Items.Should().BeEmpty();
        ranked.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task InMemory_composition_audit_evidence_package_export_fails_when_assessment_missing()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditEvidencePackageExportService exportService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditEvidencePackageExportService>();

        AuditEvidencePackageExportResult exportResult = await exportService.TryExportAsync(
            scope,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            CancellationToken.None);

        exportResult.Succeeded.Should().BeFalse();
        exportResult.ErrorMessage.Should().Contain("Assessment not found");
        exportResult.ZipContent.Should().BeNull();
    }

    [Fact]
    public async Task InMemory_composition_remediation_pattern_match_reports_no_match_without_patterns()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IRemediationPatternMatcherService matcher =
            serviceScope.ServiceProvider.GetRequiredService<IRemediationPatternMatcherService>();

        RemediationPatternMatchEvaluationResult missingFinding = await matcher.MatchFindingAsync(
            scope,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CancellationToken.None);

        missingFinding.Succeeded.Should().BeFalse();
        missingFinding.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task InMemory_composition_tenant_branding_repository_writes_invalidate_resolved_profile_cache()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ITenantBrandingService brandingService =
            serviceScope.ServiceProvider.GetRequiredService<ITenantBrandingService>();
        ITenantBrandingProfileRepository brandingRepository =
            serviceScope.ServiceProvider.GetRequiredService<ITenantBrandingProfileRepository>();
        TenantBrandingResolvedProfileCache brandingCache =
            serviceScope.ServiceProvider.GetRequiredService<TenantBrandingResolvedProfileCache>();

        (await brandingService.GetCompanyDisplayNameAsync(scope.TenantId, CancellationToken.None))
            .Should().Be(ProductBrandingDefaults.CompanyDisplayName);

        brandingCache.TryGet(scope.TenantId, out _).Should().BeTrue();

        DateTime utcNow = DateTime.UtcNow;
        await brandingRepository.InsertAsync(
            new TenantBrandingProfileRecord
            {
                BrandingProfileId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                CompanyDisplayName = "Activated Tenant Brand",
                BrandingStatus = BrandingProfileStatus.Active,
                Version = 1,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
                CreatedBy = "operator",
                UpdatedBy = "operator",
            },
            CancellationToken.None);

        (await brandingService.GetCompanyDisplayNameAsync(scope.TenantId, CancellationToken.None))
            .Should().Be("Activated Tenant Brand");
    }

    [Fact]
    public async Task InMemory_composition_operational_security_finding_ingest_succeeds_without_durable_noop_row()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IOperationalSecurityFindingIngestService ingestService =
            serviceScope.ServiceProvider.GetRequiredService<IOperationalSecurityFindingIngestService>();
        IOperationalSecurityFindingRepository findingRepository =
            serviceScope.ServiceProvider.GetRequiredService<IOperationalSecurityFindingRepository>();

        OperationalSecurityFindingBatchIngestResult ingestResult = await ingestService.IngestBatchAsync(
            scope,
            [
                new OperationalSecurityFindingIngestItem
                {
                    Provider = CloudProvider.Azure,
                    SourceSystem = "composition-hunt",
                    SourceFindingId = "finding-ingest-1",
                    Title = "Sample finding",
                    Severity = "High",
                    Status = OperationalSecurityFindingStatus.Open,
                },
            ],
            "actor@test",
            CancellationToken.None);

        ingestResult.FailedCount.Should().Be(0);
        ingestResult.IngestedCount.Should().Be(1);
        Guid findingId = ingestResult.Items[0].FindingId!.Value;

        OperationalSecurityFindingRecord? stored = await findingRepository.TryGetByIdAsync(
            scope.TenantId,
            findingId,
            CancellationToken.None);

        stored.Should().BeNull(
            "InMemory NoOpOperationalSecurityFindingRepository is intentional local durability; ingest success matches handoff noop pattern");

        OperationalSecurityFindingDetailResult detail = await ingestService.TryGetDetailAsync(
            scope,
            findingId,
            CancellationToken.None);

        detail.Succeeded.Should().BeFalse();
        detail.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task InMemory_composition_audit_evidence_snapshot_collection_fails_closed_without_inventory_snapshots()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditEvidenceSnapshotCollectionService collectionService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditEvidenceSnapshotCollectionService>();

        AuditEvidenceSnapshotCollectionResult emptyInventory = await collectionService.TryCollectSnapshotAsync(
            scope,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            [],
            CancellationToken.None);

        emptyInventory.Succeeded.Should().BeFalse();
        emptyInventory.ErrorMessage.Should().Contain("At least one inventory snapshot id is required");

        AuditEvidenceSnapshotCollectionResult missingAssessment = await collectionService.TryCollectSnapshotAsync(
            scope,
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            [Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")],
            CancellationToken.None);

        missingAssessment.Succeeded.Should().BeFalse();
        missingAssessment.ErrorMessage.Should().Contain("Assessment was not found");
    }

    [Fact]
    public async Task InMemory_composition_path_explanation_and_inspector_agree_on_unknown_path_id()
    {
        ScopeContext scope = CreateDefaultScope();
        Guid missingPathId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ISecurityEvidencePathInspectorQueryService inspector =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityEvidencePathInspectorQueryService>();
        ISecurityEvidencePathExplanationService explanationService =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityEvidencePathExplanationService>();

        SecurityEvidencePathDetailResponse? detail =
            await inspector.TryGetPathDetailAsync(scope, missingPathId, CancellationToken.None);

        detail.Should().BeNull();

        SecurityEvidencePathExplanationResult explanation = await explanationService.TryBuildExplanationAsync(
            scope,
            missingPathId,
            useSimulator: true,
            allowInsufficientEvidence: false,
            CancellationToken.None);

        explanation.Succeeded.Should().BeFalse();
        explanation.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task InMemory_composition_remediation_instance_create_fails_without_pattern_match()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IRemediationInstanceService instanceService =
            serviceScope.ServiceProvider.GetRequiredService<IRemediationInstanceService>();
        IProjectScopedRemediationInstanceRepository instanceRepository =
            serviceScope.ServiceProvider.GetRequiredService<IProjectScopedRemediationInstanceRepository>();

        RemediationInstanceOperationResult createResult = await instanceService.CreateFromMatchAsync(
            scope,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "operator@example.com",
            CancellationToken.None);

        createResult.Succeeded.Should().BeFalse();
        createResult.ErrorMessage.Should().Contain("No active remediation pattern match");

        IReadOnlyList<RemediationInstanceRecord> instances =
            await instanceRepository.ListByScopeAsync(scope.ToProjectScopeKey(), CancellationToken.None);

        instances.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemory_composition_ask_grounding_blank_question_fails_while_sparse_identifiers_mark_insufficient_evidence()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IInfraEvidenceAskGroundingService askGroundingService =
            serviceScope.ServiceProvider.GetRequiredService<IInfraEvidenceAskGroundingService>();

        InfraEvidenceAskGroundingResult blankQuestion = await askGroundingService.TryAnswerAsync(
            scope,
            new InfraEvidenceAskRequest
            {
                Question = "   ",
                UseSimulator = true,
            },
            CancellationToken.None);

        blankQuestion.Succeeded.Should().BeFalse();
        blankQuestion.ErrorMessage.Should().Contain("Question is required");

        InfraEvidenceAskGroundingResult sparseIdentifiers = await askGroundingService.TryAnswerAsync(
            scope,
            new InfraEvidenceAskRequest
            {
                Question = "What infrastructure changed in this workspace?",
                UseSimulator = true,
            },
            CancellationToken.None);

        sparseIdentifiers.Succeeded.Should().BeTrue(sparseIdentifiers.ErrorMessage);
        sparseIdentifiers.Response!.InsufficientEvidence.Should().BeTrue(
            "empty collector bundle is insufficient evidence, not a request validation failure");
    }

    [Fact]
    public async Task InMemory_composition_audit_evidence_freshness_dashboard_returns_empty_counts_without_snapshots()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditEvidenceFreshnessService freshnessService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditEvidenceFreshnessService>();

        AuditEvidenceFreshnessDashboardRecord dashboard = await freshnessService.GetDashboardCountsAsync(
            scope,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CancellationToken.None);

        dashboard.CurrentCount.Should().Be(0);
        dashboard.StaleCount.Should().Be(0);
        dashboard.MissingCount.Should().Be(0);
    }

    [Fact]
    public async Task InMemory_composition_audit_continuous_readiness_skips_reevaluation_when_diff_has_no_impacted_evidence()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IAuditContinuousReadinessService readinessService =
            serviceScope.ServiceProvider.GetRequiredService<IAuditContinuousReadinessService>();

        AuditContinuousReadinessProcessResult result = await readinessService.ProcessInventoryDiffAsync(
            scope,
            new AzureInventoryDiffSummaryRecord
            {
                DiffId = Guid.NewGuid(),
                SnapshotAId = Guid.NewGuid(),
                SnapshotBId = Guid.NewGuid(),
                TotalChanges = 0,
            },
            [],
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.AffectedControlIds.Should().BeEmpty();
        result.ReEvaluatedControlIds.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemory_composition_security_asset_assertion_create_succeeds_without_durable_noop_repository_row()
    {
        ScopeContext scope = CreateDefaultScope();
        DateTime utcNow = DateTime.UtcNow;

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ICloudResourceIdentityDirectory identityDirectory =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceIdentityDirectory>();
        ISecurityAssetAssertionService assertionService =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityAssetAssertionService>();
        ISecurityAssetAssertionRepository assertionRepository =
            serviceScope.ServiceProvider.GetRequiredService<ISecurityAssetAssertionRepository>();

        CloudResourceIdentityRecord upserted = await identityDirectory.UpsertOnSnapshotAsync(
            scope,
            CloudProvider.Azure,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/acct",
            Guid.NewGuid(),
            resourceType: "Microsoft.Storage/storageAccounts",
            subscriptionOrAccountId: "sub",
            resourceGroupOrProject: "rg",
            region: "eastus",
            displayName: "acct",
            CancellationToken.None);

        SecurityAssetAssertionCreateResult createResult = await assertionService.CreateAsync(
            scope,
            new SecurityAssetAssertionCreateRequest
            {
                CloudResourceId = upserted.CloudResourceId,
                DataSensitivity = SecurityAssetDataSensitivity.Phi,
                RegulatoryClass = SecurityAssetRegulatoryClass.Hipaa,
                DeploymentEnvironment = SecurityAssetDeploymentEnvironment.Production,
                BusinessCriticality = SecurityAssetBusinessCriticality.CrownJewel,
                IsPatientImpact = true,
                Rationale = new string('x', FindingDispositionValidation.MinimumRationaleLength),
                ExpirationUtc = utcNow.AddDays(30),
                RequestedByActorKey = "requester",
                ApprovedByActorKey = "approver",
            },
            CancellationToken.None);

        createResult.Succeeded.Should().BeTrue(createResult.ErrorMessage);
        createResult.AssertionId.Should().NotBe(Guid.Empty);

        IReadOnlyList<SecurityAssetAssertionRecord> persisted =
            await assertionRepository.ListByScopeAsync(scope.ToProjectScopeKey(), CancellationToken.None);

        persisted.Should().BeEmpty(
            "InMemory composition wires NoOpSecurityAssetAssertionRepository; create succeeds without durable rows by design");
    }

    [Fact]
    public async Task InMemory_composition_cloud_resource_lineage_reports_unavailable_without_audit_snapshot_rows()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        ICloudResourceIdentityDirectory identityDirectory =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceIdentityDirectory>();
        ICloudResourceAuditLineageResolver lineageResolver =
            serviceScope.ServiceProvider.GetRequiredService<ICloudResourceAuditLineageResolver>();

        CloudResourceIdentityRecord upserted = await identityDirectory.UpsertOnSnapshotAsync(
            scope,
            CloudProvider.Azure,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-1",
            Guid.NewGuid(),
            resourceType: "Microsoft.KeyVault/vaults",
            subscriptionOrAccountId: "sub",
            resourceGroupOrProject: "rg",
            region: "eastus",
            displayName: "kv-1",
            CancellationToken.None);

        CloudResourceAuditLineageLink link = await lineageResolver.ResolveAsync(
            scope,
            upserted.CloudResourceId,
            new CloudResourceEvidenceHubQuery(),
            CancellationToken.None);

        link.Available.Should().BeFalse();
        link.DegradedReason.Should().Contain("No audit evidence snapshot rows");
    }

    [Fact]
    public async Task InMemory_composition_structured_diagram_ingest_fails_closed_without_sealed_run_even_with_empty_sources()
    {
        ScopeContext scope = CreateDefaultScope();

        IConfiguration configuration = CreateOpenApiLikeInMemoryConfiguration();
        ServiceCollection services = CreateCompositionServices(configuration, scope);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });

        using IServiceScope serviceScope = provider.CreateScope();
        IStructuredDiagramIngestService ingestService =
            serviceScope.ServiceProvider.GetRequiredService<IStructuredDiagramIngestService>();

        Func<Task> act = () => ingestService.IngestAsync(
            scope,
            Guid.NewGuid(),
            new StructuredDiagramIngestRequest { Sources = [] },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void InfraEvidenceCompositionModule_registers_single_scoped_carry_forward_service()
    {
        ServiceCollection services = [];
        InfraEvidenceCompositionModule.Register(services, new ConfigurationBuilder().Build());

        int carryForwardRegistrations = services.Count(static descriptor =>
            descriptor.ServiceType == typeof(SecureNowArchitectPathCarryForwardService));

        carryForwardRegistrations.Should().Be(1,
            "coordinator delegates carry-forward through ISecureNowArchitectNeighborhoodRunner; single concrete registration is current intentional wiring");
    }

    private static ScopeContext CreateDefaultScope() =>
        new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

    private static void RegisterInfraEvidenceSnapshotMermaidServiceTestDoubles(IServiceCollection services)
    {
        services.AddScoped(_ => Mock.Of<IAzureInventorySnapshotGraphResolver>());
        services.AddScoped(_ => Mock.Of<IMermaidDiagramInventoryRenderOrchestrator>());
        services.AddScoped(_ => Mock.Of<IMermaidDiagramFallbackSetBuilder>());
        services.AddScoped(_ => Mock.Of<IBrandedDiagramExportService>());
        services.AddScoped(_ => Mock.Of<IDiagramImageRenderer>());
        services.AddSingleton<IDiagramAstGraphvizDotEmitter, DiagramAstGraphvizDotEmitter>();
        services.AddSingleton<IDiagramForestLayoutSvgRenderer, DiagramForestLayoutSvgRenderer>();
        services.AddScoped(_ => Mock.Of<IGraphvizLayoutRenderer>());
        services.AddScoped(_ => Mock.Of<IArchitectureDiagramReconciliationRepository>());
        services.AddScoped(_ => Mock.Of<IAuthorityQueryService>());
        services.AddScoped(_ => Mock.Of<IManifestHashService>());
    }

    private static MermaidDiagramReadabilityThresholds ReadMermaidReadabilityThresholds(
        InfraEvidenceSnapshotMermaidService mermaidService)
    {
        FieldInfo? field = typeof(InfraEvidenceSnapshotMermaidService).GetField(
            "_thresholds",
            BindingFlags.Instance | BindingFlags.NonPublic);

        field.Should().NotBeNull();

        return (MermaidDiagramReadabilityThresholds)field!.GetValue(mermaidService)!;
    }

    private static ServiceCollection CreateCompositionServices(IConfiguration configuration, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(scope);

        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        CompositionTestHostEnvironment hostEnvironment = new(Environments.Development);
        services.AddSingleton<IHostEnvironment>(hostEnvironment);
        services.AddSingleton<IWebHostEnvironment>(hostEnvironment);
        services.AddSingleton<IHostApplicationLifetime, CompositionTestHostApplicationLifetime>();
        services.AddLogging();
        services.AddSingleton<IScopeContextProvider>(new FixedCompositionScopeContextProvider(scope));

        return services;
    }

    private static IConfiguration CreateOpenApiLikeInMemoryConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:Role"] = "Api",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1",
                    ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
                    ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
                    ["LlmCompletionCache:Enabled"] = "false",
                    ["HotPathCache:Enabled"] = "false",
                })
            .Build();
    }

    private sealed class FixedCompositionScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }
}
