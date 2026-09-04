using ArchLucid.AgentRuntime;
using ArchLucid.Application.Ask;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AskServiceConversationCompressionTests
{
    [Fact]
    public async Task AskAsync_prepends_compressed_summary_when_compression_enabled()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Guid runId = Guid.NewGuid();
        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId
        };

        List<ConversationMessage> history = [];
        for (int i = 0; i < 8; i++)
        {
            history.Add(new ConversationMessage
            {
                Role = i % 2 == 0 ? ConversationMessageRole.User : ConversationMessageRole.Assistant,
                Content = $"message-{i}"
            });
        }

        Mock<IConversationService> conversationService = new();
        conversationService
            .Setup(c => c.GetOrCreateThreadAsync(
                It.IsAny<Guid?>(),
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runId,
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(thread);
        conversationService
            .Setup(c => c.GetHistoryAsync(thread.ThreadId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(history);

        ManifestDocument manifest = new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestId = Guid.NewGuid(),
        };
        AskSealedManifestTestSupport.ApplySealedManifestDefaults(manifest);
        Mock<IAuthorityQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = manifest });

        string? capturedUserPrompt = null;
        Mock<IAgentCompletionClient> llm = new();
        llm.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .Callback<string, string, int?, float?, CancellationToken>((_, user, _, _, _) => capturedUserPrompt = user)
            .ReturnsAsync("""
                          {
                            "answer": "ok",
                            "referencedDecisions": [],
                            "referencedFindings": [],
                            "referencedArtifacts": []
                          }
                          """);

        Mock<IConversationContextCompressor> compressor = new();
        compressor
            .Setup(c => c.CompressAsync(It.IsAny<IReadOnlyList<ConversationMessage>>(), 4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompressedConversationContext
            {
                CompressedSummary = "Earlier topics covered encryption.",
                RecentVerbatim = history.TakeLast(4).ToArray()
            });

        Mock<IOptionsMonitor<ConversationContextOptions>> contextOptions = new();
        contextOptions.Setup(o => o.CurrentValue).Returns(new ConversationContextOptions
        {
            CompressionEnabled = true,
            MaxVerbatimTurns = 6,
            MaxTurnsToKeepVerbatim = 4
        });

        AskService sut = AskServiceTestFactory.Create(
            llm: llm.Object,
            conversationService: conversationService.Object,
            query: query.Object,
            conversationContextCompressor: compressor.Object,
            conversationContextOptions: contextOptions.Object);

        await sut.AskAsync(
            new AskRequest { RunId = runId, Question = "What changed?" },
            scope,
            CancellationToken.None);

        capturedUserPrompt.Should().NotBeNull();
        capturedUserPrompt.Should().Contain("[Compressed prior context]");
        capturedUserPrompt.Should().Contain("Earlier topics covered encryption.");
        compressor.Verify(
            c => c.CompressAsync(It.Is<IReadOnlyList<ConversationMessage>>(m => m.Count >= 7), 4, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
