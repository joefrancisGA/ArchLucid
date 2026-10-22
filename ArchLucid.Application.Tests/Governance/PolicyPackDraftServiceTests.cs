using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackDraftServiceTests
{
    [Fact]
    public async Task DraftRuleAsync_returns_llm_json_with_disclaimer()
    {
        const string draft = """{"id":"test-rule","title":"Test"}""";

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);

        PolicyPackDraftService sut = new(client.Object);

        DraftPolicyPackRuleResponse response = await sut.DraftRuleAsync(
            new DraftPolicyPackInput { FreeTextIntent = "Require encryption for all regulated data stores at rest." },
            CancellationToken.None);

        response.DraftRuleJson.Should().Be(draft);
        response.Disclaimer.Should().Be(DraftPolicyPackRuleResponse.DefaultDisclaimer);
    }
}
