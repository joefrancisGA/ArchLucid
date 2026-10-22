using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Architecture.Tests.WorkerCapability;

/// <summary>Builds Worker/Combined composition <see cref="IServiceCollection" /> for hosted-service discovery.</summary>
internal static class WorkerCompositionServiceCollectionBuilder
{
    internal static ServiceCollection BuildForRole(ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            throw new ArgumentOutOfRangeException(nameof(hostingRole), hostingRole, "Worker or Combined only.");

        IConfiguration configuration = CreateConfiguration(hostingRole);
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddSingleton<IHostEnvironment>(new WorkerCapabilityTestHostEnvironment());
        services.AddLogging(static builder => builder.AddDebug());
        services.AddHttpContextAccessor();
        services.AddHostedService<WorkerHostDrainHostedService>();
        services.AddHostedService<GracefulShutdownNotificationHostedService>();
        services.AddArchLucidApplicationServices(configuration, hostingRole);

        return services;
    }

    private static IConfiguration CreateConfiguration(ArchLucidHostingRole hostingRole)
    {
        string role = hostingRole switch
        {
            ArchLucidHostingRole.Worker => "Worker",
            ArchLucidHostingRole.Combined => "Combined",
            _ => throw new ArgumentOutOfRangeException(nameof(hostingRole), hostingRole, "Worker or Combined only."),
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(CreateConfigurationDictionary(role))
            .Build();
    }

    private static Dictionary<string, string?> CreateConfigurationDictionary(string hostingRole)
    {
        return new Dictionary<string, string?>
        {
            ["Hosting:Role"] = hostingRole,
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] = "InMemory",
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
            ["Billing:Provider"] = "Noop",
            ["LlmCompletionCache:Enabled"] = "false",
            ["HotPathCache:Enabled"] = "false",
            ["BackgroundJobs:Mode"] = "InMemory",
        };
    }

    private sealed class WorkerCapabilityTestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Architecture.Tests";

        public string ContentRootPath { get; set; } = "/";

        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } =
            new Microsoft.Extensions.FileProviders.NullFileProvider();
    }
}
