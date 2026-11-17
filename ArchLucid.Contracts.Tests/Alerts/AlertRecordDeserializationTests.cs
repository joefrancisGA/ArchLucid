using System.Text.Json;

using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class AlertRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_status_yields_open_not_null()
    {
        const string json = """
            {
              "alertId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "ruleId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "workspaceId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "projectId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "title": "t",
              "category": "c",
              "severity": "High",
              "status": null,
              "triggerValue": "v"
            }
            """;

        AlertRecord? record = JsonSerializer.Deserialize<AlertRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.Status.Should().Be(AlertStatus.Open);
    }
}
