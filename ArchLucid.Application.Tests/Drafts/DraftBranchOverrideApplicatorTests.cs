using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftBranchOverrideApplicatorTests
{
    [Fact]
    public void Apply_QuestionAnswer_RequiresOverrideKey()
    {
        DraftRequestDocument document = new();

        BranchDraftRequest request = new()
        {
            OverrideKind = DraftBranchOverrideKind.QuestionAnswer,
            OverrideValue = "answer",
        };

        Action act = () => DraftBranchOverrideApplicator.Apply(document, request);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*OverrideKey*");
    }

    [Fact]
    public void Apply_BusinessOutcome_SetsDocumentField()
    {
        DraftRequestDocument document = new();

        DraftBranchOverrideApplicator.Apply(
            document,
            new BranchDraftRequest
            {
                OverrideKind = DraftBranchOverrideKind.BusinessOutcome,
                OverrideValue = "Reduce spend by 30%",
            });

        document.BusinessOutcome.Should().Be("Reduce spend by 30%");
    }
}
