using ArchLucid.Application.Drafts;
using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestApplicationFacadeTests
{
    [Fact]
    public async Task DraftArchitectureRequestAsync_delegates_to_architecture_request_draft_service()
    {
        DraftArchitectureRequestInput input = new()
        {
            FreeTextDescription = "A sufficiently long architecture overview for draft intake."
        };

        DraftArchitectureRequestResponse expected = new()
        {
            SuggestedConstraints = ["constraint-a"],
        };

        Mock<IArchitectureRequestDraftService> draftService = new();
        draftService
            .Setup(s => s.DraftAsync(input, It.IsAny<CancellationToken>(), null))
            .ReturnsAsync(expected);

        DraftRequestApplicationFacade sut = new(draftService.Object);

        DraftArchitectureRequestResponse result =
            await sut.DraftArchitectureRequestAsync(input, CancellationToken.None);

        result.Should().BeSameAs(expected);
        draftService.Verify(
            s => s.DraftAsync(input, It.IsAny<CancellationToken>(), null),
            Times.Once);
    }
}
