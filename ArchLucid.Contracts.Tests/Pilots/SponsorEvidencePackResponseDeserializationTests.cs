using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class SponsorEvidencePackResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_nested_pack_objects_yields_non_null_defaults()
    {
        const string json = """
            {
              "processInstrumentation": null,
              "explainabilityTrace": null,
              "governanceOutcomes": null
            }
            """;

        SponsorEvidencePackResponse? response =
            JsonSerializer.Deserialize<SponsorEvidencePackResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.ProcessInstrumentation.Should().NotBeNull();
        response.ExplainabilityTrace.Should().NotBeNull();
        response.GovernanceOutcomes.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_demo_run_value_report_delta_remains_null()
    {
        const string json = """
            {
              "demoRunValueReportDelta": null
            }
            """;

        SponsorEvidencePackResponse? response =
            JsonSerializer.Deserialize<SponsorEvidencePackResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.DemoRunValueReportDelta.Should().BeNull();
    }
}
