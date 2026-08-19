using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Suite", "Application")]
public sealed class ActiveTrialExportNoticeFormatterTests
{
    [Fact]
    public void Format_active_trial_with_expiry_includes_expiration_date()
    {
        DateTimeOffset expires = DateTimeOffset.Parse("2026-06-15T00:00:00+00:00");
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
            TrialExpiresUtc = expires
        };

        string? notice = ActiveTrialExportNoticeFormatter.Format(tenant);

        notice.Should().Be("Generated during ArchLucid Trial — Expires on 2026-06-15 UTC");
    }

    [Fact]
    public void Format_non_trial_returns_null()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted
        };

        ActiveTrialExportNoticeFormatter.Format(tenant).Should().BeNull();
    }
}
