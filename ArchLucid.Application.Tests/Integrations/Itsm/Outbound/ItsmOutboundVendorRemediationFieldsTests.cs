using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Category", "Unit")]
public sealed class ItsmOutboundVendorRemediationFieldsTests
{
    [Fact]
    public void FormatJiraDueDate_uses_utc_calendar_date()
    {
        DateTimeOffset due = new(2026, 7, 15, 3, 30, 0, TimeSpan.Zero);

        ItsmOutboundVendorRemediationFields.FormatJiraDueDate(due).Should().Be("2026-07-15");
    }

    [Fact]
    public void LooksLikeJiraAccountId_accepts_opaque_account_ids()
    {
        ItsmOutboundVendorRemediationFields.LooksLikeJiraAccountId("712020:abcd1234-5678-90ab-cdef").Should().BeTrue();
        ItsmOutboundVendorRemediationFields.LooksLikeJiraAccountId("owner@example.com").Should().BeFalse();
    }
}
