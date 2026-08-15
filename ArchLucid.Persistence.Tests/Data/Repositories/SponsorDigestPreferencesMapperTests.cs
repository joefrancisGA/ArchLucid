using ArchLucid.Contracts.Notifications;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class SponsorDigestPreferencesMapperTests
{
    [Fact]
    public void ToResponse_maps_row_and_parses_emails()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DateTime updatedUtc = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        TenantSponsorDigestPreferencesRow row = new()
        {
            TenantId = tenantId,
            SchemaVersion = 2,
            EmailEnabled = true,
            RecipientEmails = " a@example.com ; b@example.com ",
            IanaTimeZoneId = " America/New_York ",
            DayOfWeek = 3,
            HourOfDay = 9,
            UpdatedUtc = updatedUtc,
        };

        SponsorDigestPreferencesResponse response = SponsorDigestPreferencesMapper.ToResponse(row);

        response.TenantId.Should().Be(tenantId);
        response.IsConfigured.Should().BeTrue();
        response.RecipientEmails.Should().BeEquivalentTo(["a@example.com", "b@example.com"]);
        response.IanaTimeZoneId.Should().Be("America/New_York");
        response.UpdatedUtc.Should().Be(new DateTimeOffset(updatedUtc, TimeSpan.Zero));
    }

    [Fact]
    public void ToResponse_defaults_blank_timezone_to_utc()
    {
        TenantSponsorDigestPreferencesRow row = new()
        {
            TenantId = Guid.NewGuid(),
            IanaTimeZoneId = "   ",
            UpdatedUtc = DateTime.UtcNow,
        };

        SponsorDigestPreferencesResponse response = SponsorDigestPreferencesMapper.ToResponse(row);

        response.IanaTimeZoneId.Should().Be("UTC");
    }

    [Fact]
    public void SerializeEmails_skips_blank_entries()
    {
        string serialized = SponsorDigestPreferencesMapper.SerializeEmails(["  a@test.com  ", "", "  "]);

        serialized.Should().Be("a@test.com");
    }

    [Fact]
    public void ToResponse_throws_when_row_null()
    {
        Action act = () => SponsorDigestPreferencesMapper.ToResponse(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
