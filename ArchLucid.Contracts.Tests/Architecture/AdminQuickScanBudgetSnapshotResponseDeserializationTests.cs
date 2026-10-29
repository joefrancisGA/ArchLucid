using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class AdminQuickScanBudgetSnapshotResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_recent_usage_yields_empty_list_not_null()
    {
        const string json = """
            {
              "safetyEnabled": true,
              "operationalMode": "normal",
              "hourlyCeilingUsd": 10,
              "dailyCeilingUsd": 100,
              "hourBucketKey": "2026-10-29T12",
              "dayBucketKey": "2026-10-29",
              "hourReservedUsd": 0,
              "hourCommittedUsd": 0,
              "dayReservedUsd": 0,
              "dayCommittedUsd": 0,
              "pendingReservationCount": 0,
              "expiredPendingReservationCount": 0,
              "lastReconciliationExpiredCount": 0,
              "recentUsage": null
            }
            """;

        AdminQuickScanBudgetSnapshotResponse? response =
            JsonSerializer.Deserialize<AdminQuickScanBudgetSnapshotResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.RecentUsage.Should().NotBeNull().And.BeEmpty();
    }
}
