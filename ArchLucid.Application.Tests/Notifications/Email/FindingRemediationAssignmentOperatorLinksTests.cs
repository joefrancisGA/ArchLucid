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
}
