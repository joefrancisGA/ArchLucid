using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryReminderRecipientsTests
{
    [Fact]
    public void Resolve_includes_owner_and_creator_mailboxes()
    {
        IReadOnlyList<string> recipients = WaiverExpiryReminderRecipients.Resolve(
            Waiver("owner@example.com", "creator@example.com"),
            "admin@example.com");

        recipients.Should().Equal("creator@example.com", "owner@example.com");
    }

    [Fact]
    public void Resolve_deduplicates_when_owner_and_creator_match_case_insensitively()
    {
        IReadOnlyList<string> recipients = WaiverExpiryReminderRecipients.Resolve(
            Waiver("Owner@Example.com", "owner@example.com"),
            null);

        recipients.Should().HaveCount(1);
    }

    [Fact]
    public void Resolve_falls_back_to_the_tenant_admin_when_ids_are_not_mailboxes()
    {
        IReadOnlyList<string> recipients = WaiverExpiryReminderRecipients.Resolve(
            Waiver("dir-subject-1", "dir-subject-2"),
            "admin@example.com");

        recipients.Should().Equal("admin@example.com");
    }

    [Fact]
    public void Resolve_does_not_use_the_admin_fallback_when_an_owner_mailbox_exists()
    {
        IReadOnlyList<string> recipients = WaiverExpiryReminderRecipients.Resolve(
            Waiver("owner@example.com", "dir-subject-2"),
            "admin@example.com");

        recipients.Should().Equal("owner@example.com");
    }

    [Fact]
    public void Resolve_returns_empty_when_nothing_is_addressable()
    {
        IReadOnlyList<string> recipients = WaiverExpiryReminderRecipients.Resolve(
            Waiver("dir-subject-1", "dir-subject-2"),
            "   ");

        recipients.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_rejects_a_null_waiver()
    {
        Action act = () => WaiverExpiryReminderRecipients.Resolve(null!, "admin@example.com");

        act.Should().Throw<ArgumentNullException>();
    }

    private static RiskExceptionRecord Waiver(string ownerUserId, string createdByUserId)
    {
        return new RiskExceptionRecord
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            FindingId = "f-1",
            OwnerUserId = ownerUserId,
            CreatedByUserId = createdByUserId,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            Status = RiskExceptionStatus.Active,
        };
    }
}
