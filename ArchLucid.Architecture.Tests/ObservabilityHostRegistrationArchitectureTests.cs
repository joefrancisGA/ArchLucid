using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
public sealed class ObservabilityHostRegistrationArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [SkippableFact]
    public void ApiAndWorkerHosts_RegisterArchLucidOpenTelemetry()
    {
        string apiProgram = ArchitectureSourceProbe.ReadPathWithPartials(Path.Combine(RepoRoot, "ArchLucid.Api", "Program.cs"));
        string workerProgram = ArchitectureSourceProbe.ReadPathWithPartials(Path.Combine(RepoRoot, "ArchLucid.Worker", "Program.cs"));
        string jobsProgram = ArchitectureSourceProbe.ReadPathWithPartials(Path.Combine(RepoRoot, "ArchLucid.Jobs.Cli", "Program.cs"));

        apiProgram.Should().Contain("AddArchLucidOpenTelemetry");
        workerProgram.Should().Contain("AddArchLucidOpenTelemetry");
        jobsProgram.Should().Contain("AddArchLucidOpenTelemetry");
    }

    [SkippableFact]
    public void ObservabilityExtensions_ExportsAgentOutputAndLlmMeters()
    {
        string extensions = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Startup", "ObservabilityExtensions.cs"));

        extensions.Should().Contain("metrics.AddMeter(ArchLucidInstrumentation.MeterName)");
        extensions.Should().Contain("ArchLucidInstrumentation.AgentLlmCompletion.Name");
        extensions.Should().Contain("AddAzureMonitorMetricExporter");
        extensions.Should().Contain("AddOtlpExporter");
        extensions.Should().Contain("AddHostedService<RetrievalTelemetryPerTenantTagCircuitBreakerHostedService>");
        extensions.Should().NotContain("RetrievalTelemetryPerTenantTagCircuitBreakerPostConfigure");
        extensions.Should().NotContain("GetRequiredService<RetrievalTelemetryPerTenantTagCircuitBreaker>");
    }

    [SkippableFact]
    public void WorkerAndJobsCli_ProductionAppsettings_IncludeObservabilitySection()
    {
        string workerProduction = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Worker", "appsettings.Production.json"));
        string jobsProduction = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Jobs.Cli", "appsettings.Production.json"));

        workerProduction.Should().Contain("\"Observability\"");
        jobsProduction.Should().Contain("\"Observability\"");
    }
}
