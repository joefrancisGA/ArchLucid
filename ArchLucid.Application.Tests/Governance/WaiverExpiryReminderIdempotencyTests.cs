using ArchLucid.Application.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryReminderIdempotencyTests
{
    private static readonly Guid RiskExceptionId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    private static readonly DateTimeOffset Expiry = new(2026, 9, 1, 8, 30, 0, TimeSpan.Zero);

    [Fact]
    public void BuildKey_is_stable_for_the_same_exception_deadline_and_boundary()
    {
        string first = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry, 7);
        string second = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry.AddHours(9), 7);

        second.Should().Be(first);
    }

    [Fact]
    public void BuildKey_differs_per_boundary_so_each_reminder_in_the_series_can_send()
    {
        string wide = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry, 30);
        string tight = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry, 7);

        tight.Should().NotBe(wide);
    }

    [Fact]
    public void BuildKey_differs_after_renewal_moves_the_deadline()
    {
        string original = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry, 7);
        string renewed = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry.AddDays(90), 7);

        renewed.Should().NotBe(original);
    }

    [Fact]
    public void BuildKey_includes_the_template_id_and_utc_expiry_day()
    {
        string key = WaiverExpiryReminderIdempotency.BuildKey(RiskExceptionId, Expiry, 14);

        key.Should().StartWith(WaiverExpiryReminderIdempotency.EmailTemplateId);
        key.Should().Contain("2026-09-01");
        key.Should().EndWith(":14");
    }

    [Fact]
    public void BuildKey_rejects_an_empty_exception_id()
    {
        Action act = () => WaiverExpiryReminderIdempotency.BuildKey(Guid.Empty, Expiry, 7);

        act.Should().Throw<ArgumentException>();
    }
}
