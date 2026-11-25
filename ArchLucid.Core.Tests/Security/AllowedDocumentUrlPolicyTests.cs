using ArchLucid.Contracts.Requests;
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
    [InlineData("https://user:pass@example.com/doc", "embedded credentials")]
    [InlineData("https://token@example.com/doc", "embedded credentials")]
    public void TryGetRejectionReason_WhenUrlEmbedsCredentials_Rejects(string rawUrl, string expectedPhrase)
    {
        string? reason = AllowedDocumentUrlPolicy.TryGetRejectionReason(rawUrl);

        reason.Should().NotBeNull();
        reason.Should().Contain(expectedPhrase);
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

    [Fact]
    public async Task TryGetRejectionReasonAfterDnsResolveAsync_WhenHostnameDoesNotResolve_RewritesUrlPrefixToSourceDocumentUrl()
    {
        // .invalid is reserved (RFC 6761) and should NXDOMAIN without long resolver retries.
        string? reason = await AllowedDocumentUrlPolicy.TryGetRejectionReasonAfterDnsResolveAsync(
            "https://archlucid-tb274.invalid/adr.md");

        reason.Should().NotBeNull();
        reason.Should().StartWith("SourceDocumentUrl");
        reason.Should().Contain("could not be resolved");
    }

    [Fact]
    public async Task TryGetRejectionReasonAfterDnsResolveAsync_WhenSyncGuardRejects_SkipsDnsLookup()
    {
        string? reason = await AllowedDocumentUrlPolicy.TryGetRejectionReasonAfterDnsResolveAsync("https://127.0.0.1/doc");

        reason.Should().Contain("SourceDocumentUrl");
        reason.Should().Contain("private network");
    }

    [Fact]
    public async Task TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync_allows_empty_and_permitted_documents()
    {
        (await AllowedDocumentUrlPolicy.TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync([]))
            .Should().BeNull();
        List<ContextDocumentRequest> documents =
        [
            new() { Name = "inline", ContentType = "text/plain", Content = "body" },
            // Documentation-range literal: the guard's contract permits it and no DNS or HTTP is needed.
            new() { Name = "external", ContentType = "text/plain", Content = "body",
                SourceDocumentUrl = "https://192.0.2.1/doc" }
        ];
        (await AllowedDocumentUrlPolicy.TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(documents))
            .Should().BeNull();
    }

    [Fact]
    public async Task TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync_returns_first_distinct_failure()
    {
        List<ContextDocumentRequest> documents =
        [
            new() { Name = "first", ContentType = "text/plain", Content = "body",
                SourceDocumentUrl = "http://example.com/doc" },
            new() { Name = "second", ContentType = "text/plain", Content = "body",
                SourceDocumentUrl = "https://127.0.0.1/doc" }
        ];
        (await AllowedDocumentUrlPolicy.TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(documents))
            .Should().Be("SourceDocumentUrl must use the https scheme.");
    }

    [Fact]
    public async Task TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync_WhenSecondDocumentFails_ReturnsThatReason()
    {
        List<ContextDocumentRequest> documents =
        [
            new() { Name = "ok", ContentType = "text/plain", Content = "body", SourceDocumentUrl = null },
            new()
            {
                Name = "bad",
                ContentType = "text/plain",
                Content = "body",
                SourceDocumentUrl = "https://127.0.0.1/secret"
            }
        ];

        string? reason = await AllowedDocumentUrlPolicy.TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(documents);

        reason.Should().Contain("private network");
    }
}
