using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Admin;

[Trait("Category", "Unit")]
public sealed class AdminAuthConfigurationDiagnosticsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_misconfiguration_hints_yields_empty_list_not_null()
    {
        const string json = """
            {
              "authMode": "JwtBearer",
              "misconfigurationHints": null
            }
            """;

        AdminAuthConfigurationDiagnosticsResponse response =
            JsonSerializer.Deserialize<AdminAuthConfigurationDiagnosticsResponse>(json, ContractJson.CamelCaseCompact)!;

        response.MisconfigurationHints.Should().NotBeNull().And.BeEmpty();
    }
}
