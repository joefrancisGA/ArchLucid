using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SqlPasswordCredentialIssueMessagesTests
{
    [Fact]
    public void For_password_present_includes_managed_identity_guidance()
    {
        string message = SqlPasswordCredentialIssueMessages.For(SqlPasswordCredentialIssueKind.PasswordPresent);

        message.Should().Contain("Password");
        message.Should().Contain("Managed Identity");
    }

    [Fact]
    public void For_user_id_without_authentication_includes_authentication_guidance()
    {
        string message = SqlPasswordCredentialIssueMessages.For(SqlPasswordCredentialIssueKind.UserIdWithoutAuthentication);

        message.Should().Contain("User ID without Authentication");
        message.Should().Contain("Managed Identity");
    }

    [Fact]
    public void For_invalid_kind_throws()
    {
        Action act = () => SqlPasswordCredentialIssueMessages.For((SqlPasswordCredentialIssueKind)99);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
