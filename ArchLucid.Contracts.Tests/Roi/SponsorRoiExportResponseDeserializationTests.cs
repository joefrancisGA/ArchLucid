using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class SponsorRoiExportResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "rows": null,
              "savingsByEnvironment": null
            }
            """;

        SponsorRoiExportResponse? result =
            JsonSerializer.Deserialize<SponsorRoiExportResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Rows.Should().NotBeNull().And.BeEmpty();
        result.SavingsByEnvironment.Should().NotBeNull().And.BeEmpty();
    }
}
