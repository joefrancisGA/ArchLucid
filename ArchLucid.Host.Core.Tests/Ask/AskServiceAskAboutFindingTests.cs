using ArchLucid.AgentRuntime;
using ArchLucid.Application.Ask;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AskServiceAskAboutFindingTests
{
    [Fact]
    public async Task AskAboutFindingAsync_returns_parsed_response()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId
        };

        Mock<IConversationService> conversationService = new();
        conversationService
            .Setup(c => c.GetOrCreateThreadAsync(
                null,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                null,
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(thread);
        conversationService
            .Setup(c => c.GetHistoryAsync(thread.ThreadId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Guid runId = Guid.NewGuid();

        Mock<IFindingInspectReadRepository> findingRepository = new();
        findingRepository
            .Setup(r => r.GetInspectAsync(scope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Contracts.Findings.FindingInspectResponse
            {
                FindingId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                Severity = Contracts.Findings.FindingSeverity.Warning,
                Evidence =
                [
                    new Contracts.Findings.FindingInspectEvidenceItem { Excerpt = "evidence-line" }
                ]
            });

        ManifestDocument goldenManifest = new()
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestId = Guid.NewGuid(),
        };
        AskSealedManifestTestSupport.ApplySealedManifestDefaults(goldenManifest);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { GoldenManifest = goldenManifest });

        Mock<IAgentCompletionClient> llm = new();
        llm.Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("""
                          {
                            "answer": "Use private endpoint.",
                            "referencedDecisions": [],
                            "referencedFindings": ["finding-1"],
                            "referencedArtifacts": []
                          }
                          """);

        AskService sut = AskServiceTestFactory.Create(
            llm: llm.Object,
            conversationService: conversationService.Object,
            findingInspectReadRepository: findingRepository.Object,
            query: authority.Object);

        AskResponse response = await sut.AskAboutFindingAsync(
            new FindingAskRequest
            {
                FindingId = Guid.NewGuid(),
                Question = "How do I fix this?"
            },
            scope,
            CancellationToken.None);

        response.ThreadId.Should().Be(thread.ThreadId);
        response.Answer.Should().Be("Use private endpoint.");
        response.ReferencedFindings.Should().Contain("finding-1");
    }
}
