using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Validation;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Validation;

[Trait("Category", "Unit")]
public sealed class SchemaValidationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "errors": null,
              "detailedErrors": null
            }
            """;

        SchemaValidationResult? result =
            JsonSerializer.Deserialize<SchemaValidationResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Errors.Should().NotBeNull().And.BeEmpty();
        result.DetailedErrors.Should().NotBeNull().And.BeEmpty();
    }
}
