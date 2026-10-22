using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryReminderEmailComposerTests
{
    private static readonly DateTimeOffset Expiry = new(2026, 9, 1, 8, 30, 0, TimeSpan.Zero);

    [Fact]
    public void Compose_uses_an_approaching_subject_while_days_remain()
    {
        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(Notification(daysRemaining: 7, boundaryDays: 7), Options());

        content.Subject.Should().Be("Contoso Governance: accepted risk expires in 7 day(s)");
    }

    [Fact]
    public void Compose_uses_a_reached_expiry_subject_once_the_deadline_lands()
    {
        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(Notification(daysRemaining: 0, boundaryDays: 0), Options());

        content.Subject.Should().Be("Contoso Governance: accepted risk has reached its expiry date");
    }

    [Fact]
    public void Compose_defaults_the_product_name_when_unset()
    {
        WaiverExpiryReminderEmailContent content = WaiverExpiryReminderEmailComposer.Compose(
            Notification(daysRemaining: 3, boundaryDays: 7),
            new EmailNotificationOptions { OperatorBaseUrl = "https://app.example.com" });

        content.Subject.Should().StartWith("ArchLucid:");
    }

    [Fact]
    public void Compose_links_to_the_decision_register_on_the_configured_operator_host()
    {
        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(Notification(daysRemaining: 3, boundaryDays: 7), Options());

        string expected = $"https://app.example.com{WaiverExpiryReminderEmailComposer.DecisionRegisterPath}";

        content.HtmlBody.Should().Contain($"href=\"{expected}\"");
        content.TextBody.Should().Contain(expected);
    }

    [Fact]
    public void Compose_states_that_expiry_never_decides_on_its_own()
    {
        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(Notification(daysRemaining: 1, boundaryDays: 7), Options());

        content.HtmlBody.Should().Contain("a person decides");
    }

    [Fact]
    public void Compose_html_encodes_finding_identifiers()
    {
        WaiverExpiryNotification notification = Notification(daysRemaining: 5, boundaryDays: 7, findingId: "f<1>&2");

        WaiverExpiryReminderEmailContent content =
            WaiverExpiryReminderEmailComposer.Compose(notification, Options());

        content.HtmlBody.Should().Contain("f&lt;1&gt;&amp;2");
        content.HtmlBody.Should().NotContain("f<1>&2");
    }

    [Fact]
    public void Compose_rejects_null_arguments()
    {
        Action nullNotification = () => WaiverExpiryReminderEmailComposer.Compose(null!, Options());
        Action nullOptions = () =>
            WaiverExpiryReminderEmailComposer.Compose(Notification(daysRemaining: 1, boundaryDays: 7), null!);

        nullNotification.Should().Throw<ArgumentNullException>();
        nullOptions.Should().Throw<ArgumentNullException>();
    }

    private static EmailNotificationOptions Options()
    {
        return new EmailNotificationOptions
        {
            OperatorBaseUrl = "https://app.example.com/",
            ProductDisplayName = "Contoso Governance",
        };
    }

    private static WaiverExpiryNotification Notification(
        int daysRemaining,
        int boundaryDays,
        string findingId = "f-1")
    {
        return new WaiverExpiryNotification
        {
            BoundaryDays = boundaryDays,
            DaysRemaining = daysRemaining,
            Waiver = new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                FindingId = findingId,
                OwnerUserId = "owner@example.com",
                CreatedByUserId = "creator@example.com",
                ExpiresAtUtc = Expiry,
                Status = RiskExceptionStatus.Active,
            },
        };
    }
}
