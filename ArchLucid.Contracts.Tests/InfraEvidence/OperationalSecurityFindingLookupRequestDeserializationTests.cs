using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class OperationalSecurityFindingLookupRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_source_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "sourceSystem": "defender",
              "sourceFindingIds": null
            }
            """;

        OperationalSecurityFindingLookupRequest request =
            JsonSerializer.Deserialize<OperationalSecurityFindingLookupRequest>(json, ContractJson.CamelCaseCompact)!;

        request.SourceFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
