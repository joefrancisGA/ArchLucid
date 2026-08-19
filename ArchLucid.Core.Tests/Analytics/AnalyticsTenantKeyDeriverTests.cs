using ArchLucid.Core.Analytics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Analytics;

[Trait("Category", "Unit")]
public sealed class AnalyticsTenantKeyDeriverTests
{
    [Fact]
    public void DeriveAnalyticsTenantKey_is_stable_for_same_tenant_and_salt()
    {
        Guid tenantId = Guid.Parse("6f3f3b2a-9c4e-4b1a-8f2d-1a2b3c4d5e6f");
        AnalyticsTenantKeyDeriver deriver = new("unit-test-salt");

        string first = deriver.DeriveAnalyticsTenantKey(tenantId);
        string second = deriver.DeriveAnalyticsTenantKey(tenantId);

        first.Should().Be(second);
        first.Should().HaveLength(64);
        first.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void DeriveAnalyticsTenantKey_changes_when_salt_changes()
    {
        Guid tenantId = Guid.Parse("6f3f3b2a-9c4e-4b1a-8f2d-1a2b3c4d5e6f");
        AnalyticsTenantKeyDeriver a = new("salt-a");
        AnalyticsTenantKeyDeriver b = new("salt-b");

        a.DeriveAnalyticsTenantKey(tenantId).Should().NotBe(b.DeriveAnalyticsTenantKey(tenantId));
    }

    [Fact]
    public void Export_formats_do_not_contain_raw_tenant_id()
    {
        Guid tenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        AnalyticsTenantKeyDeriver deriver = new("export-test-salt");
        InternalCrossTenantRollupDailyRow row = new()
        {
            RollupDate = new DateOnly(2026, 5, 16),
            AnalyticsTenantKey = deriver.DeriveAnalyticsTenantKey(tenantId),
            TotalRunsNonArchived = 3,
            TotalCompletedRuns = 2,
            AverageCompletedRunDurationSeconds = 12.5,
            EstimatedEngineeringHoursSaved = 1.25m,
            LlmTokensUsed = 900,
            ComputedUtc = new DateTimeOffset(2026, 5, 16, 12, 0, 0, TimeSpan.Zero),
        };

        string csv = InternalCrossTenantRollupExportFormatter.ToCsv([row]);
        string json = InternalCrossTenantRollupExportFormatter.ToJson([row]);

        csv.Should().NotContain(tenantId.ToString());
        csv.Should().NotContain(tenantId.ToString("N"));
        json.Should().NotContain(tenantId.ToString());
        json.Should().NotContain(tenantId.ToString("N"));
        csv.Should().Contain(row.AnalyticsTenantKey);
        json.Should().Contain(row.AnalyticsTenantKey);
    }
}
