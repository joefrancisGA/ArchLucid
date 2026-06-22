using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingExternalTrackingDerivedFieldsTests
{
    [Fact]
    public void IsTrackedExternally_is_true_when_linked_tickets_summary_present()
    {
        RunFindingExternalTrackingReadRow row = new()
        {
            FindingId = "f-1",
            ItsmLinkedTicketsSummary = "Jira:ABC-1"
        };

        RunFindingExternalTrackingDerivedFields.IsTrackedExternally(row).Should().BeTrue();
        RunFindingExternalTrackingDerivedFields.ResolveExternalTrackingSummary(row).Should().Be("Jira:ABC-1");
    }

    [Fact]
    public void IsTrackedExternally_is_true_when_provider_and_external_key_present()
    {
        RunFindingExternalTrackingReadRow row = new()
        {
            FindingId = "f-2",
            Provider = "ServiceNow",
            ExternalKey = "INC001"
        };

        RunFindingExternalTrackingDerivedFields.IsTrackedExternally(row).Should().BeTrue();
        RunFindingExternalTrackingDerivedFields.ResolveExternalTrackingSummary(row).Should().Be("ServiceNow:INC001");
    }

    [Fact]
    public void IsTrackedExternally_is_false_without_correlation_fields()
    {
        RunFindingExternalTrackingReadRow row = new()
        {
            FindingId = "f-3",
            HumanReviewStatus = "Pending"
        };

        RunFindingExternalTrackingDerivedFields.IsTrackedExternally(row).Should().BeFalse();
        RunFindingExternalTrackingDerivedFields.ResolveExternalTrackingSummary(row).Should().BeNull();
    }

    [Fact]
    public void WithExternalTracking_projects_tracked_externally_fields()
    {
        FindingInspectResponse source = new()
        {
            FindingId = "f-4",
            Severity = FindingSeverity.Warning,
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        };

        RunFindingExternalTrackingProjection tracking = new()
        {
            Provider = "Jira",
            ExternalKey = "SEC-9",
            TrackedExternally = true,
            ExternalTrackingSummary = "Jira:SEC-9",
            ItsmLinkedTicketsSummary = "Jira:SEC-9"
        };

        FindingInspectResponse enriched = source.WithExternalTracking(tracking);

        enriched.TrackedExternally.Should().BeTrue();
        enriched.ExternalTrackingSummary.Should().Be("Jira:SEC-9");
        enriched.Provider.Should().Be("Jira");
    }
}
