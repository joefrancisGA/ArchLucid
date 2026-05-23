using System.Reflection;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Configuration;

using Serilog;
using Serilog.Enrichers.OpenTelemetry;
using Serilog.Events;

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
                .Enrich.WithOpenTelemetryTraceId()
                .Enrich.WithOpenTelemetrySpanId()
                .Enrich.WithProperty("Application", applicationDisplayName)
                .Enrich.WithProperty("AssemblyInformationalVersion", build.InformationalVersion)
                .Enrich.WithProperty("AssemblyFileVersion", build.FileVersion ?? string.Empty)
                .WriteTo.Conditional(
                    _ => IsSerilogWriteToEmpty(context.Configuration),
                    wt => wt.Console(
                        restrictedToMinimumLevel: LogEventLevel.Information,
                        outputTemplate:
                        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties}{NewLine}{Exception}"));
        });
    }

    internal static bool IsSerilogWriteToEmpty(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return !configuration
            .GetSection("Serilog:WriteTo")
            .GetChildren()
            .Any();
    }
}
