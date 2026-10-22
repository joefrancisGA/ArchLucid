using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.DecisionTraces;

[Trait("Category", "Unit")]
public sealed class RunEventTracePayloadDeserializationTests
{
    [Fact]
    public void Deserialize_null_metadata_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "traceId": "t1",
              "runId": "run-1",
              "eventType": "optionsEvaluated",
              "eventDescription": "desc",
              "metadata": null
            }
            """;

        RunEventTracePayload payload =
            JsonSerializer.Deserialize<RunEventTracePayload>(json, ContractJson.Default)!;

        payload.Metadata.Should().NotBeNull().And.BeEmpty();
    }
}
