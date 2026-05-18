using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Configuration;
using ArchLucid.Api.Demo;
using ArchLucid.Api.Startup;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Startup;
using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Architecture.Tests.DependencyInjection;

/// <summary>
///     Builds the API host <see cref="IServiceCollection" /> used to validate controller/handler constructor wiring
///     (simulator + in-memory storage; no Kestrel).
/// </summary>
internal static class ApiSimulatorCompositionServiceCollectionBuilder
{
    public static ServiceCollection Build()
    {
        IConfiguration configuration = CreateConfiguration();
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        ArchitectureDiTestHostEnvironment hostEnvironment = new(Environments.Development);
        services.AddSingleton<IHostEnvironment>(hostEnvironment);
        services.AddSingleton<IWebHostEnvironment>(hostEnvironment);
        services.AddLogging(static builder => builder.AddDebug());

        services.AddHealthChecks();
        services.AddArchLucidMvc(configuration);
        services.AddHttpContextAccessor();
        services.AddSingleton<IScopeContextProvider, FixedArchitectureDiScopeContextProvider>();
        services.AddArchLucidAuth(configuration);
        services.AddArchLucidSaml2IfEnabled(configuration, hostEnvironment);
        services.AddArchLucidAuthorization();
        services.AddArchLucidOpenTelemetry(configuration, hostEnvironment, "ArchLucid.Architecture.Tests");
        services.AddArchLucidRateLimiting(configuration);
        services.Configure<E2EHarnessOptions>(configuration.GetSection(E2EHarnessOptions.SectionName));
        services.AddArchLucidCors(configuration);
        services.AddArchLucidResponseCompression();
        services.Configure<ArchitectureRunCreationPayloadLimitsOptions>(
            configuration.GetSection(ArchitectureRunCreationPayloadLimitsOptions.SectionName));
        services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);
        services.AddArchLucidApiWebLayerServices(configuration);
        services.AddScoped<IGovernancePreviewService, GovernancePreviewService>();
        services.AddScoped<QuickStartService>();

        return services;
    }

    private static IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(CreateConfigurationDictionary())
            .Build();
    }

    private static Dictionary<string, string?> CreateConfigurationDictionary()
    {
        return new Dictionary<string, string?>
        {
            ["Hosting:Role"] = "Api",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
            ["DataConsistency:InitialDelaySeconds"] = "0",
            ["HostLeaderElection:Enabled"] = "false",
            ["IntegrationEvents:QueueOrTopicName"] = "",
            ["IntegrationEvents:ServiceBusConnectionString"] = "",
            ["IntegrationEvents:ServiceBusFullyQualifiedNamespace"] = "",
            ["IntegrationEvents:ServiceBusManagedIdentityClientId"] = "",
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:Endpoint"] = "",
            ["AzureOpenAI:ApiKey"] = "",
            ["AzureOpenAI:DeploymentName"] = "",
            ["AzureOpenAI:EmbeddingDeploymentName"] = "",
            ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
            ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
            ["RateLimiting:Expensive:PermitLimit"] = "100000",
            ["RateLimiting:Expensive:WindowMinutes"] = "1",
            ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
            ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
            ["RateLimiting:Registration:PermitLimit"] = "100000",
            ["RateLimiting:Registration:WindowMinutes"] = "1",
            ["Billing:Provider"] = "Noop",
            ["LlmCompletionCache:Enabled"] = "false",
            ["HotPathCache:Enabled"] = "false"
        };
    }

    private sealed class ArchitectureDiTestHostEnvironment(string environmentName) : IHostEnvironment, IWebHostEnvironment
    {
        public string EnvironmentName
        {
            get;
            set;
        } = environmentName;

        public string ApplicationName
        {
            get;
            set;
        } = "ArchLucid.Architecture.Tests";

        public string ContentRootPath
        {
            get;
            set;
        } = "/";

        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider
        {
            get;
            set;
        } = new Microsoft.Extensions.FileProviders.NullFileProvider();

        public string WebRootPath
        {
            get;
            set;
        } = "/wwwroot";

        public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider
        {
            get;
            set;
        } = new Microsoft.Extensions.FileProviders.NullFileProvider();
    }

    private sealed class FixedArchitectureDiScopeContextProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
            };
        }
    }
}
