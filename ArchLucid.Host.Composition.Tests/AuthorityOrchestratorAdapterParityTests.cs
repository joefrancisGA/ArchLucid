using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Parity between <see cref="AuthorityRunOrchestratorApplicationAdapter" /> (Legacy port) and
///     <see cref="DtfAuthorityRunOrchestrator" />: both are pure forwards to
///     <see cref="AuthorityRunOrchestrator" />. Same inner + same scenario must yield equivalent terminal run shape and
///     audit event-type sequences (multiset / ordered by occurrence).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityOrchestratorAdapterParityTests
{
    [Fact]
    public async Task ExecuteAsync_legacy_and_dtf_wrappers_match_terminal_shape_and_audit_event_types()
    {
        Dictionary<string, string?> data = CreateSimulatorCompositionDictionary();
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        await using ServiceProvider provider = services.BuildServiceProvider();
        await using AsyncServiceScope scope = provider.CreateAsyncScope();

        AuthorityRunOrchestrator inner =
            scope.ServiceProvider.GetRequiredService<AuthorityRunOrchestrator>();

        AuthorityRunOrchestratorApplicationAdapter legacyAdapter =
            new(inner);

        DtfAuthorityRunOrchestrator dtfAdapter =
            new(inner);

        IAuditRepository auditRepository =
            scope.ServiceProvider.GetRequiredService<IAuditRepository>();

        ContextIngestionRequest template = new()
        {
            ProjectId = "parity-adapter-test",
            ArchitectureRequestId = "parity-arch-req",
            Description = "authority adapter parity (simulator)"
        };

        RunRecord legacyRun = await legacyAdapter.ExecuteAsync(Clone(template));
        RunRecord dtfRun = await dtfAdapter.ExecuteAsync(Clone(template));

        RunTerminalFingerprint(legacyRun).Should().Be(RunTerminalFingerprint(dtfRun));

        ScopeContext scopeContext =
            scope.ServiceProvider.GetRequiredService<IScopeContextProvider>().GetCurrentScope();

        string legacyTypesJoined = await FormatAuditEventTypesAsync(
            auditRepository,
            scopeContext,
            legacyRun.RunId);

        string dtfTypesJoined = await FormatAuditEventTypesAsync(
            auditRepository,
            scopeContext,
            dtfRun.RunId);

        legacyTypesJoined.Should().Be(dtfTypesJoined);
    }

    private static ContextIngestionRequest Clone(ContextIngestionRequest source)
    {
        return new ContextIngestionRequest
        {
            RunId = source.RunId,
            ArchitectureRequestId = source.ArchitectureRequestId,
            ProjectId = source.ProjectId,
            Description = source.Description,
            InlineRequirements = [.. source.InlineRequirements],
            Documents = [.. source.Documents],
            PolicyReferences = [.. source.PolicyReferences],
            TopologyHints = [.. source.TopologyHints],
            SecurityBaselineHints = [.. source.SecurityBaselineHints],
            InfrastructureDeclarations = [.. source.InfrastructureDeclarations]
        };
    }

    /// <summary>
    ///     Stable comparison excluding run-unique identifiers and timestamps (parity of authority outcome shape).
    /// </summary>
    private static string RunTerminalFingerprint(RunRecord run)
    {
        return string.Join(
            '|',
            run.StructuralExecutionMode,
            run.LegacyRunStatus ?? "",
            run.GoldenManifestId.HasValue,
            run.ContextSnapshotId.HasValue,
            run.GraphSnapshotId.HasValue,
            run.FindingsSnapshotId.HasValue,
            run.DecisionTraceId.HasValue,
            run.ArtifactBundleId.HasValue,
            run.CompletedUtc.HasValue);
    }

    private static async Task<string> FormatAuditEventTypesAsync(
        IAuditRepository auditRepository,
        ScopeContext scope,
        Guid runId)
    {
        IReadOnlyList<AuditEvent> events = await auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            new AuditEventFilter { RunId = runId, Take = 500 },
            CancellationToken.None);

        IOrderedEnumerable<AuditEvent> ordered = events.OrderBy(static e => e.OccurredUtc)
            .ThenBy(static e => e.EventId);

        IEnumerable<string> types = ordered.Select(static e => e.EventType);

        return string.Join(',', types);
    }

    private static ServiceCollection CreateCoreServices(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddSingleton<IHostEnvironment>(
            new CompositionTestHostEnvironment(Environments.Development));
        services.AddLogging(static b => b.AddDebug());
        services.AddHttpContextAccessor();
        services.AddSingleton<IScopeContextProvider, FixedCompositionScopeContextProvider>();

        return services;
    }

    private static Dictionary<string, string?> CreateSimulatorCompositionDictionary()
    {
        return new Dictionary<string, string?>
        {
            ["Hosting:Role"] = "Api",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
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
            ["LlmCompletionCache:Enabled"] = "false",
            ["HotPathCache:Enabled"] = "false"
        };
    }

    private sealed class FixedCompositionScopeContextProvider : IScopeContextProvider
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
