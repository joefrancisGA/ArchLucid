using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceRecorderReproTests
{
    private sealed class FixedScopeProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() =>
            new()
            {
                TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                WorkspaceId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProjectId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
    }

    private sealed class NoOpAuditService : IAuditService
    {
        public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class SpyAuditService : IAuditService
    {
        public AuditEvent? LastEvent { get; private set; }

        public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken)
        {
            LastEvent = auditEvent;

            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task RecordAsync_persists_prompt_repro_fields()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        AgentExecutionTraceRecorder sut = CreateRecorder(repo, persistFull: false);

        AgentPromptReproMetadata meta = new("topology-system", "1.0.0", "abc123deadbeef", "pilot-a");

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Topology,
            "system",
            "user",
            "{}",
            "{}",
            parseSucceeded: true,
            errorMessage: null,
            meta);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");

        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.PromptTemplateId.Should().Be("topology-system");
        t.PromptTemplateVersion.Should().Be("1.0.0");
        t.SystemPromptContentSha256.Should().Be("abc123deadbeef");
        t.PromptReleaseLabel.Should().Be("pilot-a");
    }

    [Fact]
    public async Task RecordAsync_when_model_metadata_null_uses_unspecified_sentinels()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        AgentExecutionTraceRecorder sut = CreateRecorder(repo, persistFull: false);

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Topology,
            "system",
            "user",
            "{}",
            "{}",
            parseSucceeded: true,
            errorMessage: null,
            promptRepro: null,
            inputTokenCount: null,
            outputTokenCount: null,
            modelDeploymentName: null,
            modelVersion: null);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.ModelDeploymentName.Should().Be(AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName);
        t.ModelVersion.Should().Be(AgentExecutionTraceModelMetadata.UnspecifiedModelVersion);
    }

    [Fact]
    public async Task RecordAsync_persists_token_counts_and_estimated_cost_when_enabled()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        IOptions<LlmCostEstimationOptions> opts = Options.Create(
            new LlmCostEstimationOptions
            {
                Enabled = true,
                InputUsdPerMillionTokens = 1m,
                OutputUsdPerMillionTokens = 2m,
            });
        AgentExecutionTraceRecorder sut = CreateRecorder(repo, persistFull: false, costOptions: opts);

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Topology,
            "system",
            "user",
            "{}",
            "{}",
            parseSucceeded: true,
            errorMessage: null,
            promptRepro: null,
            inputTokenCount: 1_000_000,
            outputTokenCount: 500_000);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.InputTokenCount.Should().Be(1_000_000);
        t.OutputTokenCount.Should().Be(500_000);
        t.EstimatedCostUsd.Should().Be(2m);
    }

    [Fact]
    public async Task RecordAsync_when_persist_full_true_sets_blob_keys_inline_before_return()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        AgentExecutionTraceRecorder sut = CreateRecorder(repo, persistFull: true);

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Topology,
            "full-system",
            "full-user",
            "full-response",
            "{}",
            parseSucceeded: true,
            errorMessage: null);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptBlobKey.Should().NotBeNullOrEmpty();
        t.FullUserPromptBlobKey.Should().NotBeNullOrEmpty();
        t.FullResponseBlobKey.Should().NotBeNullOrEmpty();
        t.BlobUploadFailed.Should().BeFalse();
    }

    [Fact]
    public async Task RecordAsync_when_persist_full_false_does_not_set_blob_keys()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        AgentExecutionTraceRecorder sut = CreateRecorder(repo, persistFull: false);

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Topology,
            "full-system",
            "full-user",
            "full-response",
            "{}",
            parseSucceeded: true,
            errorMessage: null);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptBlobKey.Should().BeNull();
        t.FullUserPromptBlobKey.Should().BeNull();
        t.FullResponseBlobKey.Should().BeNull();
    }

    [Fact]
    public async Task RecordAsync_when_blob_writes_fail_sets_blob_upload_failed_and_audits()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        SpyAuditService spyAudit = new();
        Mock<IArtifactBlobStore> blobMock = new();
        blobMock
            .Setup(b => b.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("simulated blob failure"));

        AgentExecutionTraceRecorder sut = CreateRecorder(
            repo,
            persistFull: true,
            blobStore: blobMock.Object,
            auditService: spyAudit);

        await sut.RecordAsync(
            "run-1",
            "task-1",
            AgentType.Compliance,
            "s",
            "u",
            "r",
            "{}",
            parseSucceeded: true,
            errorMessage: null);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync("run-1");
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.BlobUploadFailed.Should().BeTrue();
        spyAudit.LastEvent.Should().NotBeNull();
        spyAudit.LastEvent!.EventType.Should().Be(AuditEventTypes.AgentTraceBlobPersistenceFailed);
        spyAudit.LastEvent.DataJson.Should().Contain("upload_failed");
    }

    private static AgentExecutionTraceRecorder CreateRecorder(
        InMemoryAgentExecutionTraceRepository repo,
        bool persistFull,
        IOptions<LlmCostEstimationOptions>? costOptions = null,
        IArtifactBlobStore? blobStore = null,
        IAuditService? auditService = null)
    {
        IOptions<LlmCostEstimationOptions> cost = costOptions ?? Options.Create(new LlmCostEstimationOptions { Enabled = false });
        ServiceCollection services = new();
        services.AddScoped<IAgentExecutionTraceRepository>(_ => repo);
        services.AddSingleton(blobStore ?? new InMemoryArtifactBlobStore());
        services.AddSingleton(cost);
        services.AddSingleton(
            Options.Create(new AgentExecutionTraceStorageOptions { PersistFullPrompts = persistFull }));
        services.AddSingleton<ILlmCostEstimator, LlmCostEstimator>();
        services.AddSingleton<IAuditService>(_ => auditService ?? new NoOpAuditService());
        services.AddSingleton<IScopeContextProvider, FixedScopeProvider>();
        services.AddLogging(b => b.SetMinimumLevel(LogLevel.None));
        services.AddScoped<AgentExecutionTraceRecorder>();
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScope scope = provider.CreateScope();

        return scope.ServiceProvider.GetRequiredService<AgentExecutionTraceRecorder>();
    }
}
