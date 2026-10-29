using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Artifacts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Artifacts;

[Trait("Category", "Unit")]
public sealed class ArtifactBundleDeserializationTests
{
    [Fact]
    public void Deserialize_null_artifacts_yields_empty_list_not_null()
    {
        const string json = """
            {
              "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "workspaceId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "bundleId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "runId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "manifestId": "ffffffff-ffff-ffff-ffff-ffffffffffff",
              "createdUtc": "2026-10-29T12:00:00Z",
              "artifacts": null
            }
            """;

        ArtifactBundle? bundle =
            JsonSerializer.Deserialize<ArtifactBundle>(json, ContractJson.CamelCaseCompact);

        bundle.Should().NotBeNull();
        bundle!.Artifacts.Should().NotBeNull().And.BeEmpty();
    }
}
