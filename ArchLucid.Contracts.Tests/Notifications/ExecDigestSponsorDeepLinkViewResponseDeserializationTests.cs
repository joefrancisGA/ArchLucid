using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Notifications;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Notifications;

[Trait("Category", "Unit")]
public sealed class ExecDigestSponsorDeepLinkViewResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_top_runs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "target": "sponsor",
              "weekLabel": "2026-W42",
              "topRuns": null,
              "signInUrl": "https://example.test/sign-in"
            }
            """;

        ExecDigestSponsorDeepLinkViewResponse response =
            JsonSerializer.Deserialize<ExecDigestSponsorDeepLinkViewResponse>(json, ContractJson.CamelCaseCompact)!;

        response.TopRuns.Should().NotBeNull().And.BeEmpty();
    }
}
