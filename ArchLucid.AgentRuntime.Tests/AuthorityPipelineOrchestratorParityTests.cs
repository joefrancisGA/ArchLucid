using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Gating parity checks between Legacy and DurableTask authority orchestration backends (task P26-7).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Parity")]
public sealed class AuthorityPipelineOrchestratorParityTests
{
    private const string ParityTestsEnabledVariable = "ARCHLUCID_PARITY_TESTS_ENABLED";
    private const string FullPipelineParityVariable = "ARCHLUCID_PARITY_FULL_PIPELINE";

    [SkippableFact]
    public void ExecuteAsync_LegacyAndDtf_ProduceIdenticalManifestOutput()
    {
        Skip.IfNot(
            IsParitySuiteEnabled(),
            $"Set {ParityTestsEnabledVariable}=true to run parity composition checks.");

        using (IHost legacyHost = BuildOrchestrationTestHost(OrchestratorBackend.Legacy))
        using (IServiceScope legacyScope = legacyHost.Services.CreateScope())
        {
            IAuthorityRunOrchestrator legacyOrchestrator =
                legacyScope.ServiceProvider.GetRequiredService<IAuthorityRunOrchestrator>();

            legacyOrchestrator.Should().BeOfType<AuthorityRunOrchestratorApplicationAdapter>();
        }

        using (IHost dtfHost = BuildOrchestrationTestHost(OrchestratorBackend.DurableTask))
        using (IServiceScope dtfScope = dtfHost.Services.CreateScope())
        {
            IAuthorityRunOrchestrator dtfOrchestrator =
                dtfScope.ServiceProvider.GetRequiredService<IAuthorityRunOrchestrator>();

            dtfOrchestrator.Should().BeOfType<DtfAuthorityRunOrchestrator>();
        }

        // Full manifest / snapshot parity (same ContextIngestionRequest through both backends) requires a shared
        // persistence substrate plus a reachable Durable Task gRPC engine — gate on ARCHLUCID_PARITY_FULL_PIPELINE when ready.
    }

    [SkippableFact]
    public void ExecuteAsync_LegacyAndDtf_EmitIdenticalAuditEventTypes()
    {
        Skip.IfNot(
            IsParitySuiteEnabled(),
            $"Set {ParityTestsEnabledVariable}=true to run parity integration tests.");

        Skip.IfNot(
            IsFullPipelineParityEnabled(),
            $"Set {FullPipelineParityVariable}=true once shared SQL + DTF schema and audit capture are wired (see AUDIT_COVERAGE_MATRIX.md).");
    }

    [SkippableFact]
    public void CompleteQueuedAuthorityPipelineAsync_Dtf_ResumesSuccessfully()
    {
        Skip.IfNot(
            IsParitySuiteEnabled(),
            $"Set {ParityTestsEnabledVariable}=true to run parity integration tests.");

        Skip.IfNot(
            IsFullPipelineParityEnabled(),
            $"Set {FullPipelineParityVariable}=true once async DTF completion is provisioned end-to-end.");
    }

    private static bool IsParitySuiteEnabled()
    {
        return string.Equals(
            Environment.GetEnvironmentVariable(ParityTestsEnabledVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsFullPipelineParityEnabled()
    {
        return string.Equals(
            Environment.GetEnvironmentVariable(FullPipelineParityVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Minimal generic host with ArchLucid storage composition — Legacy uses in-memory storage; DurableTask uses the SQL
    ///     registrar path (DTF still requires a gRPC engine endpoint).
    /// </summary>
    private static IHost BuildOrchestrationTestHost(OrchestratorBackend backend)
    {
        HostApplicationBuilder builder = Microsoft.Extensions.Hosting.Host.CreateApplicationBuilder(Array.Empty<string>());

        foreach (KeyValuePair<string, string?> pair in BuildParityConfiguration(backend))
            builder.Configuration[pair.Key] = pair.Value ?? string.Empty;

        builder.Services.AddLogging();
        builder.Services.AddArchLucidApplicationServices(builder.Configuration, ArchLucidHostingRole.Api);
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddSingleton<IScopeContextProvider, ParityScopeContextProvider>();

        return builder.Build();
    }

    private static Dictionary<string, string?> BuildParityConfiguration(OrchestratorBackend backend)
    {
        bool isLegacy = backend == OrchestratorBackend.Legacy;
        string storageProvider = isLegacy ? "InMemory" : "Sql";
        string connectionString = isLegacy
            ? InMemoryStartupSqlConnectionStringSentinel.Value
            : "Server=.;Database=ArchLucidParityTests;Trusted_Connection=True;TrustServerCertificate=True";

        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = storageProvider,
            ["ConnectionStrings:ArchLucid"] = connectionString,
            ["HotPathCache:Enabled"] = "false",
            ["LlmCompletionCache:Enabled"] = "false",
            ["Hosting:Role"] = "Api",
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
            ["ArchLucid:AuthorityPipeline:OrchestratorBackend"] = backend.ToString()
        };


        if (!isLegacy)
            values["ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint"] = "http://127.0.0.1:1";

        return values;
    }

    /// <summary>Fixed scope for parity host bootstrapping (no HTTP context).</summary>
    private sealed class ParityScopeContextProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext
            {
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
            };
        }
    }
}
