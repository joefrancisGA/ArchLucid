using ArchLucid.Application.Identity;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class PostAuthTermsAttestationGateTests
{
    [Fact]
    public void DenyIfTermsNotAccepted_returns_deny_when_false()
    {
        PostAuthCreateWorkspaceResult? result = PostAuthTermsAttestationGate.DenyIfTermsNotAccepted(false);

        result.Should().NotBeNull();
        result!.Succeeded.Should().BeFalse();
        result.CustomerMessage!.ToLowerInvariant().Should().Contain("terms");
    }

    [Fact]
    public void DenyIfTermsNotAccepted_returns_null_when_true()
    {
        PostAuthCreateWorkspaceResult? result = PostAuthTermsAttestationGate.DenyIfTermsNotAccepted(true);

        result.Should().BeNull();
    }
}
