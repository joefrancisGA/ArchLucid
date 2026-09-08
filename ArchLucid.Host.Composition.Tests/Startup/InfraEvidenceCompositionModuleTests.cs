using System.Reflection;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Application.InfraEvidence.SecurityCrosswalk;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Composition.Tests;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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
        InfraEvidenceCompositionModule.Register(services);

        services.Should().Contain(static d => d.ServiceType == typeof(ICloudResourceEvidenceHubService));
        services.Should().Contain(static d => d.ServiceType == typeof(ICloudResourceExplorerQueryService));
        services.Should().Contain(static d => d.ServiceType == typeof(IAuditEvidenceSelectorRegistry));
        services.Should().Contain(static d => d.ServiceType == typeof(ITenantBrandingCacheInvalidator));
        services.Should().Contain(static d => d.ServiceType == typeof(ISecurityCrosswalkService));
        services.Should().Contain(static d => d.ServiceType == typeof(MermaidDiagramReadabilityThresholds));
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
        services.AddScoped(_ => Mock.Of<IDiagramAstFromGraphCompiler>());
        services.AddScoped(_ => Mock.Of<IMermaidDiagramRenderPipeline>());
        services.AddScoped(_ => Mock.Of<IBrandedDiagramExportService>());
        services.AddScoped(_ => Mock.Of<IDiagramImageRenderer>());
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
