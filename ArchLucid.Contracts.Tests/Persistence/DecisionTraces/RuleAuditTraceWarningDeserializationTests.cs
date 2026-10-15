using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.DecisionTraces;

[Trait("Category", "Unit")]
public sealed class RuleAuditTraceWarningDeserializationTests
{
    [Fact]
    public void Deserialize_null_missing_field_paths_yields_empty_list_not_null()
    {
        const string json = """
            {
              "missingFieldPaths": null
            }
            """;

        RuleAuditTraceWarning? result =
            JsonSerializer.Deserialize<RuleAuditTraceWarning>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.MissingFieldPaths.Should().NotBeNull().And.BeEmpty();
    }
}
