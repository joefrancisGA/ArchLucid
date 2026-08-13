using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class RecurrenceCompletionOperatorLinksTests
{
    private static readonly Guid SourceRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TriggeredRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void BuildCompareUrl_uses_canonical_compare_route_and_lifecycle_anchor()
    {
        string url = RecurrenceCompletionOperatorLinks.BuildCompareUrl(
            "https://app.example.com",
            SourceRunId,
            TriggeredRunId);

        url.Should().Be(
            "https://app.example.com/insights/compare-two-reviews?priorRunId=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&laterRunId=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb#compare-finding-lifecycle");
    }

    [Fact]
    public void BuildCompareUrl_returns_a_relative_path_when_operator_base_is_absent()
    {
        string url = RecurrenceCompletionOperatorLinks.BuildCompareUrl(null, SourceRunId, TriggeredRunId);

        url.Should().StartWith("/insights/compare-two-reviews?");
        url.Should().EndWith("#compare-finding-lifecycle");
    }
}
