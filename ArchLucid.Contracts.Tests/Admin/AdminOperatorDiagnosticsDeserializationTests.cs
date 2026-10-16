using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminOperatorDiagnosticsDeserializationTests
{
    [Fact]
    public void Deserialize_null_per_agent_type_floors_yields_empty_list_not_null()
    {
        const string json = """
            {
              "perAgentTypeFloors": null
            }
            """;

        AdminQualityGateDiagnosticsResponse? result =
            JsonSerializer.Deserialize<AdminQualityGateDiagnosticsResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PerAgentTypeFloors.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_retried_outbox_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "retriedOutboxIds": null
            }
            """;

        IntegrationOutboxDeadLetterBulkRetryResponse? result =
            JsonSerializer.Deserialize<IntegrationOutboxDeadLetterBulkRetryResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.RetriedOutboxIds.Should().NotBeNull().And.BeEmpty();
    }
}
