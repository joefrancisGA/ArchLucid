using ArchLucid.Application.Jobs;
using ArchLucid.Application.Operations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using Azure.Core;
using Azure.Storage.Queues;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class DataHealthJobsCompositionModule
{
    private static void RegisterBackgroundJobs(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<BackgroundJobsOptions>(configuration.GetSection(BackgroundJobsOptions.SectionName));

        BackgroundJobsOptions jobsSnapshot =
            configuration.GetSection(BackgroundJobsOptions.SectionName).Get<BackgroundJobsOptions>() ??
            new BackgroundJobsOptions();

        bool durable = string.Equals(jobsSnapshot.Mode, "Durable", StringComparison.OrdinalIgnoreCase);

        services.AddScoped<IBackgroundJobWorkUnitScopeResolver, BackgroundJobWorkUnitScopeResolver>();
        services.AddScoped<IBackgroundJobWorkUnitExecutor, BackgroundJobWorkUnitExecutor>();
        services.AddScoped<IBackgroundJobTenantAccessVerifier, BackgroundJobTenantAccessVerifier>();
        services.AddScoped<IBackgroundJobWorkUnitAccessor, BackgroundJobWorkUnitAccessor>();
        services.AddScoped<IBackgroundJobInfoReader, BackgroundJobInfoReader>();
        services.AddSingleton<IOperationCancellationRegistry, OperationCancellationRegistry>();
        services.AddScoped<OperationRunCancellationMarker>();
        services.AddScoped<IOperationCancelService, OperationCancelService>();
        services.AddScoped<IOperationQueryService, OperationQueryService>();

        if (hostingRole == ArchLucidHostingRole.Worker)
        {
            // Queue-backed info/work-unit accessors are registered above for all roles; Worker must
            // still resolve IBackgroundJobQueue (in-memory or durable) so host composition validates.

            if (!durable)
            {
                services.AddSingleton<IBackgroundJobQueue, InMemoryBackgroundJobQueue>();
                services.AddHostedService(static sp =>
                    (InMemoryBackgroundJobQueue)sp.GetRequiredService<IBackgroundJobQueue>());
                services.AddScoped<IBackgroundJobCancellationWriter, NoOpBackgroundJobCancellationWriter>();

                return;
            }

            RegisterDurableBackgroundJobInfrastructure(services);
            services.AddSingleton<IBackgroundJobQueueNotifySender, AzureStorageQueueBackgroundJobNotifySender>();
            services.AddSingleton<IBackgroundJobQueue, DurableBackgroundJobQueue>();
            services.AddHostedService<BackgroundJobQueueProcessorHostedService>();
            services.AddScoped<IBackgroundJobCancellationWriter, BackgroundJobRepositoryCancellationWriter>();

            return;
        }

        if (hostingRole is not (ArchLucidHostingRole.Api or ArchLucidHostingRole.Combined))
            return;


        if (durable)
        {
            RegisterDurableBackgroundJobInfrastructure(services);
            services.AddSingleton<IBackgroundJobQueueNotifySender, AzureStorageQueueBackgroundJobNotifySender>();
            services.AddSingleton<IBackgroundJobQueue, DurableBackgroundJobQueue>();

            if (hostingRole == ArchLucidHostingRole.Combined)
            {
                services.AddHostedService<BackgroundJobQueueProcessorHostedService>();
                services.AddScoped<IBackgroundJobCancellationWriter, BackgroundJobRepositoryCancellationWriter>();

                return;
            }
        }
        else
        {
            services.AddSingleton<IBackgroundJobQueue, InMemoryBackgroundJobQueue>();

            services.AddHostedService(static sp => (InMemoryBackgroundJobQueue)sp.GetRequiredService<IBackgroundJobQueue>());
        }

        services.AddScoped<IBackgroundJobCancellationWriter, BackgroundJobCancellationWriter>();
    }

    private static void RegisterDurableBackgroundJobInfrastructure(IServiceCollection services)
    {
        services.AddScoped<IBackgroundJobRepository, BackgroundJobRepository>();
        services.AddSingleton<IBackgroundJobResultBlobAccessor, AzureBlobBackgroundJobResultBlobAccessor>();
        services.AddSingleton(static sp => CreateBackgroundJobsQueueClient(sp));

        services.AddHostedService<BackgroundJobStuckRunningWatchdogHostedService>();
    }

    private static QueueClient CreateBackgroundJobsQueueClient(IServiceProvider serviceProvider)
    {
        BackgroundJobsOptions jobsOptions =
            serviceProvider.GetRequiredService<IOptions<BackgroundJobsOptions>>().Value;

        ArtifactLargePayloadOptions? largePayload =
            serviceProvider.GetService<IOptions<ArtifactLargePayloadOptions>>()?.Value;

        TokenCredential credential = serviceProvider.GetRequiredService<TokenCredential>();
        Uri? queueUri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobsOptions, largePayload);

        if (queueUri is null)

            throw new InvalidOperationException(
                "BackgroundJobs:QueueServiceUri is missing and could not be derived from ArtifactLargePayload:AzureBlobServiceUri. Configure a queue endpoint for durable jobs.");


        if (string.IsNullOrWhiteSpace(jobsOptions.QueueName))

            throw new InvalidOperationException("BackgroundJobs:QueueName is required when BackgroundJobs:Mode is Durable.");

        QueueServiceClient serviceClient = new(queueUri, credential);

        return serviceClient.GetQueueClient(jobsOptions.QueueName);
    }
}
