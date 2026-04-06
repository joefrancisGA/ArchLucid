using System.Reflection;

using ArchLucid.Core.Diagnostics;

using Serilog;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Shared Serilog bootstrap for API and Worker web hosts.</summary>
public static class ArchLucidSerilogConfiguration
{
    public static void Configure(WebApplicationBuilder builder, string applicationDisplayName)
    {
        builder.Host.UseSerilog((context, services, configuration) =>
        {
            Assembly hostAssembly = Assembly.GetEntryAssembly() ?? typeof(ArchLucidSerilogConfiguration).Assembly;
            BuildProvenance build = BuildProvenance.FromAssembly(hostAssembly);

            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", applicationDisplayName)
                .Enrich.WithProperty("AssemblyInformationalVersion", build.InformationalVersion)
                .Enrich.WithProperty("AssemblyFileVersion", build.FileVersion ?? string.Empty);
        });
    }
}
