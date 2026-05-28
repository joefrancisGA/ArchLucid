using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class AllowedDocumentUrlPolicyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://docs.example.com/architecture.pdf")]
    [InlineData("https://example.com:8443/path?q=1")]
    public void TryGetRejectionReason_WhenUrlIsEmptyOrPublicHttps_Allows(string? rawUrl)
    {
        string? reason = AllowedDocumentUrlPolicy.TryGetRejectionReason(rawUrl);

        reason.Should().BeNull();
    }

    [Theory]
    [InlineData("not-a-url", "absolute HTTPS URL")]
    [InlineData("http://example.com/doc", "https scheme")]
    [InlineData("https://localhost/doc", "loopback")]
    [InlineData("https://127.0.0.1/doc", "loopback")]
    [InlineData("https://10.0.0.5/doc", "private")]
    [InlineData("https://172.16.1.2/doc", "private")]
    [InlineData("https://192.168.1.9/doc", "private")]
    [InlineData("https://169.254.10.20/doc", "link-local")]
    [InlineData("https://[fe80::1]/doc", "link-local")]
    public void TryGetRejectionReason_WhenUrlTargetsUnsafeAddress_Rejects(string rawUrl, string expectedPhrase)
    {
        string? reason = AllowedDocumentUrlPolicy.TryGetRejectionReason(rawUrl);

        reason.Should().NotBeNull();
        reason.Should().Contain(expectedPhrase);
    }
}
