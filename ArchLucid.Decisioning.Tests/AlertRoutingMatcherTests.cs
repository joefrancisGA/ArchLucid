using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class AlertRoutingMatcherTests
{
    [Fact]
    public void Matches_WhenOnlyMinimumSeverityConfigured_UsesSeverityFloor()
    {
        AlertRoutingSubscription subscription = new()
        {
            MinimumSeverity = AlertSeverity.High,
            MetadataJson = "{}",
        };

        AlertRoutingSignal high = new() { Severity = AlertSeverity.High, FindingType = AlertCategories.Security, Tags = [] };
        AlertRoutingSignal warning = new() { Severity = AlertSeverity.Warning, FindingType = AlertCategories.Security, Tags = [] };

        AlertRoutingMatcher.Matches(subscription, high).Should().BeTrue();
        AlertRoutingMatcher.Matches(subscription, warning).Should().BeFalse();
    }

    [Fact]
    public void Matches_WhenFindingTypeFilterConfigured_RequiresCategoryMatch()
    {
        AlertRoutingSubscription subscription = new()
        {
            MinimumSeverity = AlertSeverity.Info,
            MetadataJson =
                """{"routingCriteria":{"findingTypes":["Security"]}}""",
        };

        AlertRoutingSignal security = new() { Severity = AlertSeverity.Warning, FindingType = AlertCategories.Security, Tags = [] };
        AlertRoutingSignal cost = new() { Severity = AlertSeverity.Critical, FindingType = AlertCategories.Cost, Tags = [] };

        AlertRoutingMatcher.Matches(subscription, security).Should().BeTrue();
        AlertRoutingMatcher.Matches(subscription, cost).Should().BeFalse();
    }

    [Fact]
    public void Matches_WhenTagFilterConfigured_RequiresAnyTagOverlap()
    {
        AlertRoutingSubscription subscription = new()
        {
            MinimumSeverity = AlertSeverity.Info,
            MetadataJson = """{"routingCriteria":{"tags":["phi"]}}""",
        };

        AlertRoutingSignal tagged = new()
        {
            Severity = AlertSeverity.Warning,
            FindingType = AlertCategories.Compliance,
            Tags = ["phi", "Compliance"],
        };

        AlertRoutingSignal untagged = new()
        {
            Severity = AlertSeverity.Critical,
            FindingType = AlertCategories.Security,
            Tags = ["Security"],
        };

        AlertRoutingMatcher.Matches(subscription, tagged).Should().BeTrue();
        AlertRoutingMatcher.Matches(subscription, untagged).Should().BeFalse();
    }
}
