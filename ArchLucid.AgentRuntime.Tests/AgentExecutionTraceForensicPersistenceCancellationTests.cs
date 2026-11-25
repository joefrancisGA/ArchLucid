using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceForensicPersistenceCancellationTests
{
    private const string TraceId = "trace-fixture";
    private const string RunId = "run-fixture";

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Caller_cancellation_during_final_response_attempt_does_not_write_fallback(bool wrapsCancellation)
    {
        using CancellationTokenSource caller = new();
        Mock<IArtifactBlobStore> blobs = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditService> audit = new();
        int responseAttempts = 0;

        blobs.Setup(b => b.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string path, string _, CancellationToken token) =>
            {
                if (!path.EndsWith("/response.txt", StringComparison.Ordinal))
                    return Task.FromResult(path);

                if (++responseAttempts < 3)
                    return Task.FromException<string>(new IOException("transient test failure"));

                caller.Cancel();
                return wrapsCancellation
                    ? Task.FromException<string>(new IOException("write stopped after cancellation"))
                    : Task.FromCanceled<string>(token);
            });

        AgentExecutionTraceForensicPersistence subject = Create(blobs.Object, traces.Object, audit.Object);

        Func<Task> persist = () => PersistAsync(subject, caller.Token);

        await persist.Should().ThrowAsync<OperationCanceledException>();
        responseAttempts.Should().Be(3);
        traces.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Caller_cancellation_before_persistence_does_not_call_blob_store()
    {
        using CancellationTokenSource caller = new();
        caller.Cancel();
        Mock<IArtifactBlobStore> blobs = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditService> audit = new();
        AgentExecutionTraceForensicPersistence subject = Create(blobs.Object, traces.Object, audit.Object);

        Func<Task> persist = () => PersistAsync(subject, caller.Token);

        await persist.Should().ThrowAsync<OperationCanceledException>();
        blobs.VerifyNoOtherCalls();
        traces.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Exhausted_response_attempts_without_cancellation_still_persist_inline()
    {
        Mock<IArtifactBlobStore> blobs = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditService> audit = new();
        string systemKey = $"{RunId}/{TraceId}/system-prompt.txt";
        string userKey = $"{RunId}/{TraceId}/user-prompt.txt";
        string responsePath = $"{RunId}/{TraceId}/response.txt";

        blobs.Setup(b => b.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string path, string _, CancellationToken _) =>
                path == responsePath
                    ? Task.FromException<string>(new IOException("persistent test failure"))
                    : Task.FromResult(path));
        traces.Setup(r => r.GetByTraceIdAsync(TraceId, CancellationToken.None))
            .ReturnsAsync(new AgentExecutionTrace
            {
                FullSystemPromptBlobKey = systemKey,
                FullUserPromptBlobKey = userKey,
                FullResponseInline = "response",
            });

        AgentExecutionTraceForensicPersistence subject = Create(blobs.Object, traces.Object, audit.Object);

        await PersistAsync(subject, CancellationToken.None);

        blobs.Verify(b => b.WriteAsync(It.IsAny<string>(), responsePath, "response", It.IsAny<CancellationToken>()),
            Times.Exactly(3));
        traces.Verify(r => r.PatchBlobStorageFieldsAsync(TraceId, systemKey, userKey, null, CancellationToken.None), Times.Once);
        traces.Verify(r => r.PatchBlobUploadFailedAsync(TraceId, true, CancellationToken.None), Times.Once);
        traces.Verify(r => r.PatchInlinePromptFallbackAsync(TraceId, null, null, "response", CancellationToken.None), Times.Once);
        traces.Verify(r => r.PatchInlineFallbackFailedAsync(TraceId, true, CancellationToken.None), Times.Never);
        audit.Verify(a => a.LogAsync(
            It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.AgentTraceBlobPersistenceFailed),
            CancellationToken.None), Times.Once);
    }

    private static AgentExecutionTraceForensicPersistence Create(
        IArtifactBlobStore blobs,
        IAgentExecutionTraceRepository traces,
        IAuditService audit)
    {
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());
        return new AgentExecutionTraceForensicPersistence(
            traces, Options.Create(new AgentExecutionTraceStorageOptions()), blobs, audit, scopes.Object,
            NullLogger<AgentExecutionTraceForensicPersistence>.Instance);
    }

    private static Task PersistAsync(AgentExecutionTraceForensicPersistence subject, CancellationToken token) =>
        subject.PersistFullPromptsAsync(TraceId, RunId, AgentType.Topology, "system", "user", "response", token);
}
