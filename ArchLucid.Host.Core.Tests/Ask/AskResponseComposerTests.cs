using ArchLucid.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskResponseComposerTests
{
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
    public void BuildFindingFallbackResponse_mentions_citations_not_loaded()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.BuildFindingFallbackResponse(threadId);

        response.Answer.Should().Contain("Finding-scoped citations were not loaded");
    }

    [Fact]
    public void Parse_returns_trimmed_text_when_response_is_not_json()
    {
        var composer = AskServiceTestFactory.CreateResponseComposer();
        var threadId = Guid.NewGuid();

        AskResponse response = composer.Parse(threadId, "  Plain text answer.  ");

        response.Answer.Should().Be("Plain text answer.");
    }
}
