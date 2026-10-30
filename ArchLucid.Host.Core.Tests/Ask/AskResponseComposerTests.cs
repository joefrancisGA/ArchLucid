using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Services.Ask;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskResponseComposerTests
{
    [Fact]
    public void BuildFindingFallbackResponse_includes_citation_honesty()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.BuildFindingFallbackResponse(threadId);

        response.Answer.Should().Contain("Citations were not stored.");
    }

    [Fact]
    public void Parse_returns_not_stored_when_json_answer_is_empty()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.Parse(threadId, """{"answer":"   "}""");

        response.Answer.Should().Be("Ask answer was not stored.");
    }

    [Fact]
    public void Parse_returns_not_stored_for_json_without_answer_field()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.Parse(threadId, """{"referencedFindings":[]}""");

        response.Answer.Should().Be("Ask answer was not stored.");
    }

    [Fact]
    public void Parse_returns_trimmed_text_when_response_is_not_json()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.Parse(threadId, "  Plain text answer.  ");

        response.Answer.Should().Be("Plain text answer.");
    }

    [Fact]
    public void BuildFallbackResponse_distinguishes_empty_manifest_decisions_from_missing_manifest()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse emptyDecisions = composer.BuildFallbackResponse(
            new AskPreparedContext(
                new ConversationThread { ThreadId = threadId },
                "question",
                string.Empty,
                new ManifestDocument { Decisions = [] },
                null,
                null,
                null,
                null,
                "{}",
                string.Empty,
                false,
                new ScopeContext(),
                []));

        AskResponse missingManifest = composer.BuildFallbackResponse(
            new AskPreparedContext(
                new ConversationThread { ThreadId = threadId },
                "question",
                string.Empty,
                null,
                null,
                null,
                null,
                null,
                "{}",
                string.Empty,
                false,
                new ScopeContext(),
                []));

        emptyDecisions.Answer.Should().Contain("Manifest decisions were stored empty on this answer.");
        missingManifest.Answer.Should().Contain("Manifest decisions were not stored on this answer.");
    }
}
