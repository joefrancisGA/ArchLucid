using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Evolution;

[Trait("Category", "Unit")]
public sealed class EvaluationScoreDeserializationTests
{
    [Fact]
    public void Deserialize_null_regression_signals_yields_empty_list_not_null()
    {
        const string json = """
            {
              "regressionSignals": null
            }
            """;

        EvaluationScore score =
            JsonSerializer.Deserialize<EvaluationScore>(json, ContractJson.CamelCaseCompact)!;

        score.RegressionSignals.Should().NotBeNull().And.BeEmpty();
    }
}
