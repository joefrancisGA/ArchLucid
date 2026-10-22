using ArchLucid.Application;
using ArchLucid.Application.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class ConflictExceptionTests
{
    [Fact]
    public void constructor_sets_message_and_optional_code()
    {
        ConflictException withoutCode = new("state");
        ConflictException withCode = new("omitted", DraftPatchCasConflictCodes.TokenMissing);

        withoutCode.Message.Should().Be("state");
        withoutCode.Code.Should().BeNull();
        withCode.Code.Should().Be(DraftPatchCasConflictCodes.TokenMissing);
    }

    [Fact]
    public void constructor_throws_when_message_or_code_missing()
    {
        Action nullMessage = () => _ = new ConflictException(null!);
        Action emptyCode = () => _ = new ConflictException("state", "  ");

        nullMessage.Should().Throw<ArgumentNullException>();
        emptyCode.Should().Throw<ArgumentException>();
    }
}
