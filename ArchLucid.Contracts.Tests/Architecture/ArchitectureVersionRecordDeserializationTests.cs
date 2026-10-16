using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureVersionRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_hash_byte_arrays_yields_empty_arrays_not_null()
    {
        const string json = """
            {
              "architectureVersionId": "00000000-0000-0000-0000-000000000001",
              "architectureId": "00000000-0000-0000-0000-000000000002",
              "tenantId": "00000000-0000-0000-0000-000000000003",
              "workspaceId": "00000000-0000-0000-0000-000000000004",
              "scopeProjectId": "00000000-0000-0000-0000-000000000005",
              "versionNumber": 1,
              "contentHashSha256": null,
              "intakeRequestHashSha256": null
            }
            """;

        ArchitectureVersionRecord? record =
            JsonSerializer.Deserialize<ArchitectureVersionRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.ContentHashSha256.Should().NotBeNull().And.BeEmpty();
        record.IntakeRequestHashSha256.Should().NotBeNull().And.BeEmpty();
    }
}
