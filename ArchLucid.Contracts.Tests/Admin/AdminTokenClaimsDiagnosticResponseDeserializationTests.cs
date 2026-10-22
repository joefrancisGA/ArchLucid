using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminTokenClaimsDiagnosticResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "resolvedRoles": null,
              "unmappedValues": null,
              "warnings": null
            }
            """;

        AdminTokenClaimsDiagnosticResponse? result =
            JsonSerializer.Deserialize<AdminTokenClaimsDiagnosticResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ResolvedRoles.Should().NotBeNull().And.BeEmpty();
        result.UnmappedValues.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
