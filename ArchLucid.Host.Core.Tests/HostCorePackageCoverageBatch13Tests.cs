using System.Text;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.ProblemDetails;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Models;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch13Tests
{
    [Fact]
    public void WebhookSignature_compute_sha256_hex_is_deterministic_lowercase()
    {
        byte[] body = Encoding.UTF8.GetBytes("{\"event\":\"run.completed\"}");

        string first = WebhookSignature.ComputeSha256Hex("shared-secret", body);
        string second = WebhookSignature.ComputeSha256Hex("shared-secret", body);

        first.Should().Be(second);
        first.Should().MatchRegex("^[0-9a-f]{64}$");
        WebhookSignature.HeaderName.Should().Be("X-ArchLucid-Webhook-Signature");
        WebhookSignature.Prefix.Should().Be("sha256=");
    }

    [Fact]
    public void WebhookSignature_rejects_blank_secret_or_null_body()
    {
        byte[] body = Encoding.UTF8.GetBytes("payload");

        Action emptySecret = () => WebhookSignature.ComputeSha256Hex(string.Empty, body);
        Action nullBody = () => WebhookSignature.ComputeSha256Hex("secret", null!);

        emptySecret.Should().Throw<ArgumentException>();
        nullBody.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null, true)]
    [InlineData("", true)]
    [InlineData("http://+:8080", false)]
    [InlineData("http://+:8080;https://+:8443", true)]
    public void AspNetCoreHostingUrls_should_use_https_redirection(string? urls, bool expected)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_URLS"] = urls,
            })
            .Build();

        AspNetCoreHostingUrls.ShouldUseHttpsRedirection(configuration).Should().Be(expected);
    }

    [Fact]
    public void HostEnvironmentClassification_detects_production_staging_and_sandbox()
    {
        IHostEnvironment production = new TestHostEnvironment { EnvironmentName = Environments.Production };
        IHostEnvironment staging = new TestHostEnvironment { EnvironmentName = Environments.Staging };
        IHostEnvironment sandbox = new TestHostEnvironment { EnvironmentName = "Sandbox" };
        IConfiguration stagingConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ARCHLUCID_ENVIRONMENT"] = "Staging" })
            .Build();

        HostEnvironmentClassification.IsProductionOrStagingLike(production, new ConfigurationBuilder().Build())
            .Should().BeTrue();
        HostEnvironmentClassification.IsProductionOrStagingLike(staging, new ConfigurationBuilder().Build())
            .Should().BeTrue();
        HostEnvironmentClassification.IsProductionOrStagingLike(
                new TestHostEnvironment { EnvironmentName = Environments.Development },
                stagingConfig)
            .Should().BeTrue();
        HostEnvironmentClassification.IsDevelopmentOrSandbox(sandbox).Should().BeTrue();
        HostEnvironmentClassification.IsDevelopmentOrSandbox(production).Should().BeFalse();
    }

    [Fact]
    public void AuthSafetyGuard_blocks_development_bypass_outside_development()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "DevelopmentBypass" })
            .Build();
        IHostEnvironment staging = new TestHostEnvironment { EnvironmentName = Environments.Staging };

        Action act = () => AuthSafetyGuard.GuardAllDevelopmentBypasses(configuration, staging);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*DevelopmentBypass auth mode is not allowed outside Development*");
    }

    [Fact]
    public void AuthSafetyGuard_allows_development_bypass_in_development_with_warning()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                ["ArchLucidAuth:DevUserId"] = "local-operator",
            })
            .Build();
        IHostEnvironment development = new TestHostEnvironment { EnvironmentName = Environments.Development };
        TestLogger logger = new();

        AuthSafetyGuard.GuardAllDevelopmentBypasses(configuration, development, logger);

        logger.Messages.Should().ContainSingle(message => message.Contains("local-operator", StringComparison.Ordinal));
    }

    [Fact]
    public void AuthSafetyGuard_requires_jwt_or_api_key_outside_development()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "OpenAccess" })
            .Build();
        IHostEnvironment staging = new TestHostEnvironment { EnvironmentName = Environments.Staging };

        Action act = () => AuthSafetyGuard.GuardAllDevelopmentBypasses(configuration, staging);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*must be JwtBearer or ApiKey outside Development*");
    }

    [Fact]
    public void AuthSafetyGuard_blocks_development_bypass_all_in_production_like_host()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["Authentication:ApiKey:DevelopmentBypassAll"] = "true",
                ["ARCHLUCID_ENVIRONMENT"] = "Production",
            })
            .Build();
        IHostEnvironment development = new TestHostEnvironment { EnvironmentName = Environments.Development };

        Action act = () => AuthSafetyGuard.GuardAllDevelopmentBypasses(configuration, development);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*DevelopmentBypassAll is not permitted outside Development*");
    }

    [Fact]
    public void ProblemDetailsAudienceHttpContext_resolves_buyer_header()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Request.Headers[ProblemDetailsAudienceHttpContext.AudienceHeaderName] = "buyer";

        ProblemDetailsAudienceHttpContext.Resolve(httpContext).Should().Be(ProblemDetailsAudience.Buyer);
        ProblemDetailsAudienceHttpContext.TryResolve(httpContext, out ProblemDetailsAudience audience).Should().BeTrue();
        audience.Should().Be(ProblemDetailsAudience.Buyer);
    }

    [Fact]
    public void ProblemDetailsAudienceHttpContext_defaults_to_operator_without_header()
    {
        DefaultHttpContext httpContext = new();

        ProblemDetailsAudienceHttpContext.Resolve(null).Should().Be(ProblemDetailsAudience.Operator);
        ProblemDetailsAudienceHttpContext.Resolve(httpContext).Should().Be(ProblemDetailsAudience.Operator);
        ProblemDetailsAudienceHttpContext.TryResolve(httpContext, out _).Should().BeFalse();
    }

    [Fact]
    public void DemoScopes_builds_default_scope_context()
    {
        ScopeContext scope = DemoScopes.BuildDemoScope();

        scope.TenantId.Should().Be(ScopeIds.DefaultTenant);
        scope.WorkspaceId.Should().Be(ScopeIds.DefaultWorkspace);
        scope.ProjectId.Should().Be(ScopeIds.DefaultProject);
    }

    [Theory]
    [InlineData(OperationalDetailedHealthChecks.CircuitBreakers, true)]
    [InlineData(OperationalDetailedHealthChecks.Database, true)]
    [InlineData("agent_execution_mode", false)]
    public void OperationalDetailedHealthChecks_includes_operational_probes_only(string registrationName, bool expected)
    {
        OperationalDetailedHealthChecks.IsIncluded(registrationName).Should().Be(expected);
    }

    [Fact]
    public void ProblemDocumentationLinks_exposes_stable_runbook_metadata()
    {
        ProblemDocumentationLinks.QualityGateRejectionRunbookRelativePath
            .Should().Be("docs/runbooks/QUALITY_GATE_REJECTION.md");
        ProblemDocumentationLinks.RunbookExtensionKey.Should().Be("runbook");
    }

    [Fact]
    public void RateLimitingDefaults_and_queue_limits_expose_product_floors()
    {
        RateLimitingDefaults.FixedWindowPermitLimit.Should().Be(100);
        RateLimitingDefaults.GovernancePolicyPackDryRunPermitLimit.Should().Be(12);
        RateLimitingDefaults.EvidenceBulkUploadPermitLimit.Should().Be(20);
        InMemoryBackgroundJobQueueLimits.MaxPendingJobs.Should().Be(500);
        InMemoryBackgroundJobQueueLimits.MaxRetainedTerminalJobs.Should().Be(200);
    }

    [Fact]
    public async Task DataArchivalHostIteration_skips_when_disabled()
    {
        Mock<IDataArchivalCoordinator> coordinator = new();
        ServiceCollection services = new();
        services.AddScoped<IDataArchivalCoordinator>(_ => coordinator.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        bool ok = await DataArchivalHostIteration.RunOnceAsync(
            scopeFactory,
            new DataArchivalOptions { Enabled = false },
            NullLogger.Instance,
            healthState: null,
            CancellationToken.None);

        ok.Should().BeTrue();
        coordinator.Verify(
            c => c.RunOnceAsync(It.IsAny<DataArchivalOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DataArchivalHostIteration_marks_health_state_and_audits_on_failure()
    {
        Mock<IDataArchivalCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.RunOnceAsync(It.IsAny<DataArchivalOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("archive failed"));

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = new();
        services.AddScoped<IDataArchivalCoordinator>(_ => coordinator.Object);
        services.AddScoped<IAuditService>(_ => audit.Object);
        IServiceScopeFactory scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        DataArchivalHostHealthState healthState = new();

        bool ok = await DataArchivalHostIteration.RunOnceAsync(
            scopeFactory,
            new DataArchivalOptions { Enabled = true },
            NullLogger.Instance,
            healthState,
            CancellationToken.None);

        ok.Should().BeFalse();
        healthState.HasAttempted.Should().BeTrue();
        healthState.Evaluate(archivalEnabled: true).Status.Should().Be(HealthStatus.Degraded);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.DataArchivalHostLoopFailed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DataArchivalHostHealthCheck_reports_degraded_after_failed_iteration()
    {
        DataArchivalHostHealthState healthState = new();
        healthState.MarkLastIterationFailed(new InvalidOperationException("boom"));
        Mock<IOptionsMonitor<DataArchivalOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new DataArchivalOptions { Enabled = true });
        DataArchivalHostHealthCheck sut = new(healthState, options.Object);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("boom");
    }

    [Fact]
    public async Task DemoViewerDataHealthCheck_degraded_when_viewer_enabled_without_seed_run()
    {
        DemoOptions demoOptions = new()
        {
            AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true },
        };
        Mock<IDemoSeedRunResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveLatestCommittedDemoRunAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        DemoViewerDataHealthCheck sut = new(Options.Create(demoOptions), resolver.Object);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("no committed Contoso demo run");
    }

    [Fact]
    public async Task RetrievalIndexFreshnessHealthCheck_healthy_when_in_memory_vector_index_and_empty_catalog()
    {
        Mock<IRetrievalDocumentIndexCatalog> catalog = new();
        catalog.Setup(c => c.GetCorpusFreshnessSummaries()).Returns([]);
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Retrieval:VectorIndex"] = "InMemory" })
            .Build();
        RetrievalIndexFreshnessHealthCheck sut = new(catalog.Object, configuration);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("in-memory retrieval index");
    }

    [Fact]
    public async Task RetrievalIndexFreshnessHealthCheck_reports_corpus_summary_when_indexed()
    {
        Mock<IRetrievalDocumentIndexCatalog> catalog = new();
        catalog.Setup(c => c.GetCorpusFreshnessSummaries()).Returns(
        [
            new RetrievalCorpusFreshnessSummary
            {
                CorpusKind = "policy-pack",
                DocumentCount = 3,
                LastIndexedUtc = new DateTime(2026, 7, 24, 0, 0, 0, DateTimeKind.Utc),
            },
        ]);
        RetrievalIndexFreshnessHealthCheck sut = new(catalog.Object, new ConfigurationBuilder().Build());

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("policy-pack docs=3");
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> Messages { get; } = [];

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullDisposable.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class NullDisposable : IDisposable
    {
        public static readonly NullDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
