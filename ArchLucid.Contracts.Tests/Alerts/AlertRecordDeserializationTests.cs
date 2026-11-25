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

    [Fact]
    public void Deserialize_null_title_yields_empty_string_not_null()
    {
        const string json = """
            {
              "alertId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "ruleId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "tenantId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "workspaceId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "projectId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "title": null,
              "category": "c",
              "severity": "High",
              "triggerValue": "v"
            }
            """;

        AlertRecord? record = JsonSerializer.Deserialize<AlertRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.Title.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_trigger_value_yields_empty_string_not_null()
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
              "triggerValue": null
            }
            """;

        AlertRecord? record = JsonSerializer.Deserialize<AlertRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.TriggerValue.Should().BeEmpty();
    }
}