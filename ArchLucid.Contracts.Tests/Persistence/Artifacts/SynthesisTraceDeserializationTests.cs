using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Artifacts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Artifacts;

[Trait("Category", "Unit")]
public sealed class SynthesisTraceDeserializationTests
{
    [Fact]
    public void Deserialize_null_generator_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "traceId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "runId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "manifestId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "createdUtc": "2026-10-29T12:00:00Z",
              "generatorsUsed": null,
              "sourceDecisionIds": null,
              "notes": null
            }
            """;

        SynthesisTrace? trace =
            JsonSerializer.Deserialize<SynthesisTrace>(json, ContractJson.CamelCaseCompact);

        trace.Should().NotBeNull();
        trace!.GeneratorsUsed.Should().NotBeNull().And.BeEmpty();
        trace.SourceDecisionIds.Should().NotBeNull().And.BeEmpty();
        trace.Notes.Should().NotBeNull().And.BeEmpty();
    }
}
