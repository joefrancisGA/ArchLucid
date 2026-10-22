using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class FindingRemediationAssignmentOperatorLinksTests
{
    [Fact]
    public void BuildFindingInspectUrl_uses_canonical_operator_route()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        string url = FindingRemediationAssignmentOperatorLinks.BuildFindingInspectUrl(
            "https://app.example.com",
            runId,
            "finding/alpha");

        url.Should().Be(
            "https://app.example.com/architecture/reviews/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/findings/finding%2Falpha");
    }

    [Fact]
    public void BuildAssignedToMeQueueUrl_returns_relative_path_without_base()
    {
        FindingRemediationAssignmentOperatorLinks.BuildAssignedToMeQueueUrl(null)
            .Should()
            .Be("/governance/findings/assigned-to-me");
    }

    [Fact]
    public void BuildFindingInspectUrl_omits_user_info_from_operator_base_url()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        string url = FindingRemediationAssignmentOperatorLinks.BuildFindingInspectUrl(
            "https://user:secret@ops.example.test",
            runId,
            "finding-1");

        url.Should().Be(
            "https://ops.example.test/architecture/reviews/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/findings/finding-1");
    }

    [Fact]
    public void BuildAssignedToMeQueueUrl_omits_user_info_from_operator_base_url()
    {
        string url = FindingRemediationAssignmentOperatorLinks.BuildAssignedToMeQueueUrl(
            "https://user:secret@ops.example.test");

        url.Should().Be("https://ops.example.test/governance/findings/assigned-to-me");
    }

    [Fact]
    public void BuildFindingInspectUrl_strips_embedded_crlf_from_finding_id_before_path_encoding()
    {
        Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        const string injectedLine = "Bcc: injected@evil.test";
        string findingIdWithBreak = $"finding-1\r\n{injectedLine}";

        string url = FindingRemediationAssignmentOperatorLinks.BuildFindingInspectUrl(
            "https://app.example.com",
            runId,
            findingIdWithBreak);

        string sanitizedForEmail = EmailBrandingUrls.SanitizeOperatorAbsoluteUrl(url);

        sanitizedForEmail.Should().NotContain("%0D", "percent-encoded CR must not reach finding inspect hrefs");
        sanitizedForEmail.Should().NotContain("%0A", "percent-encoded LF must not reach finding inspect hrefs");

        Uri absolute = new(sanitizedForEmail);
        string runHex = runId.ToString("N");
        Uri.UnescapeDataString(absolute.AbsolutePath)
            .Should()
            .Be($"/architecture/reviews/{runHex}/findings/finding-1 {injectedLine}");
    }
}
