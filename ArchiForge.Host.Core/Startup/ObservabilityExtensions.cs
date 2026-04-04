using ArchiForge.Core.Diagnostics;
using ArchiForge.DecisionEngine.Validation;
using ArchiForge.Host.Core.Configuration;

using OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace ArchiForge.Host.Core.Startup;

public static class ObservabilityExtensions
{
    public static IServiceCollection AddArchiForgeOpenTelemetry(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment,
        string telemetryServiceName)
    {
        bool prometheusEnabled = configuration.GetValue("Observability:Prometheus:Enabled", false);
        bool consoleExporterEnabled = configuration.GetValue("Observability:ConsoleExporter:Enabled", environment.IsDevelopment());

        bool otlpEnabled = configuration.GetValue("Observability:Otlp:Enabled", false);
        string? otlpEndpointRaw = configuration["Observability:Otlp:Endpoint"]?.Trim();
        Uri? otlpEndpointUri = null;
        OtlpExportProtocol otlpProtocol = OtlpExportProtocol.Grpc;
        string? otlpHeaders = configuration["Observability:Otlp:Headers"]?.Trim();

        if (otlpEnabled && !string.IsNullOrWhiteSpace(otlpEndpointRaw))
        {
            otlpEndpointUri = new Uri(otlpEndpointRaw, UriKind.Absolute);
            string protocolStr = configuration["Observability:Otlp:Protocol"]?.Trim() ?? "Grpc";
            otlpProtocol = string.Equals(protocolStr, "HttpProtobuf", StringComparison.OrdinalIgnoreCase)
                ? OtlpExportProtocol.HttpProtobuf
                : OtlpExportProtocol.Grpc;
        }

        BuildProvenance build = BuildProvenance.FromAssembly(typeof(ObservabilityExtensions).Assembly);

        services.Configure<ObservabilityHostOptions>(
            configuration.GetSection(ObservabilityHostOptions.SectionName));

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(
                    serviceName: telemetryServiceName,
                    serviceVersion: build.InformationalVersion,
                    serviceInstanceId: Environment.MachineName))
            .WithTracing(tracing =>
            {
                tracing.AddAspNetCoreInstrumentation();
                tracing.AddHttpClientInstrumentation();
                tracing.AddSqlClientInstrumentation();
                tracing.AddSource(
                    ArchiForgeInstrumentation.AdvisoryScan.Name,
                    ArchiForgeInstrumentation.AuthorityRun.Name,
                    ArchiForgeInstrumentation.RetrievalIndex.Name,
                    ArchiForgeInstrumentation.AgentHandler.Name,
                    ArchiForgeInstrumentation.AgentLlmCompletion.Name);

                if (consoleExporterEnabled)
                    tracing.AddConsoleExporter();

                if (otlpEndpointUri is not null)
                {
                    tracing.AddOtlpExporter(o =>
                    {
                        o.Endpoint = otlpEndpointUri;
                        o.Protocol = otlpProtocol;

                        if (!string.IsNullOrEmpty(otlpHeaders))
                            o.Headers = otlpHeaders;
                    });
                }
            })
            .WithMetrics(metrics =>
            {
                metrics.AddAspNetCoreInstrumentation();
                metrics.AddHttpClientInstrumentation();

                // Wires the schema-validation meter so Prometheus / OTLP exporters receive
                // schema_validation_total and schema_validation_duration_ms.
                metrics.AddMeter(SchemaValidationService.MeterName);
                metrics.AddMeter(ArchiForgeInstrumentation.MeterName);

                if (prometheusEnabled)
                    metrics.AddPrometheusExporter();

                if (otlpEndpointUri is not null)
                {
                    metrics.AddOtlpExporter(o =>
                    {
                        o.Endpoint = otlpEndpointUri;
                        o.Protocol = otlpProtocol;

                        if (!string.IsNullOrEmpty(otlpHeaders))
                            o.Headers = otlpHeaders;
                    });
                }
            });

        return services;
    }
}
