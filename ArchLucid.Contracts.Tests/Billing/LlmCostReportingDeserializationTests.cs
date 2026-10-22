using System.Text.Json;

using ArchLucid.Contracts.Billing;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class LlmCostReportingDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "daily": null,
              "byWorkspaceProject": null,
              "topRuns": null
            }
            """;

        LlmCostReportingDashboardResponse? result =
            JsonSerializer.Deserialize<LlmCostReportingDashboardResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Daily.Should().NotBeNull().And.BeEmpty();
        result.ByWorkspaceProject.Should().NotBeNull().And.BeEmpty();
        result.TopRuns.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_fleet_cogs_rows_yields_empty_list_not_null()
    {
        const string json = """
            {
              "rows": null
            }
            """;

        AdminFleetLlmCogsDashboardResponse? result =
            JsonSerializer.Deserialize<AdminFleetLlmCogsDashboardResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Rows.Should().NotBeNull().And.BeEmpty();
    }
}
