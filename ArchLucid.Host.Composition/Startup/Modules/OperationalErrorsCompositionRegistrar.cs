using ArchLucid.Application.OperationalErrors;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Operational error capture queue, drain, retention, and application services.</summary>
internal static class OperationalErrorsCompositionRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<OperationalErrorOptions>(configuration.GetSection(OperationalErrorOptions.SectionName));

        OperationalErrorOptions snapshot = configuration
                                               .GetSection(OperationalErrorOptions.SectionName)
                                               .Get<OperationalErrorOptions>()
                                           ?? new OperationalErrorOptions();

        services.AddSingleton<InMemoryOperationalErrorCaptureQueue>(
            _ => new InMemoryOperationalErrorCaptureQueue(snapshot.QueueCapacity));

        services.AddSingleton<IOperationalErrorCaptureQueue>(
            static sp => sp.GetRequiredService<InMemoryOperationalErrorCaptureQueue>());

        services.AddSingleton<IOperationalErrorCaptureService, OperationalErrorCaptureService>();
        services.AddScoped<OperationalErrorSearchService>();
        services.AddHostedService<OperationalErrorCaptureDrainHostedService>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<OperationalErrorRetentionHostedService>();
    }
}
