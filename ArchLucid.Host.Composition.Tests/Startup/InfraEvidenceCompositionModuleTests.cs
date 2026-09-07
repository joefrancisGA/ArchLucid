using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Composition.Tests;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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
    }

    [Fact]
    public async Task InMemory_composition_cloud_resource_hub_resolves_upserted_identity()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

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
