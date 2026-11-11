using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class SponsorEvidencePackEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetSponsorEvidencePack_returns_ok_with_process_and_governance_slice()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/pilots/sponsor-evidence-pack");        SponsorEvidencePackResponse? pack =
            await response.ReadJsonForTestAsync<SponsorEvidencePackResponse>(JsonOptions);

        pack.Should().NotBeNull();
        pack.DemoRunId.Should().Be(HarnessDemoBaselineSupport.DemoRunId);
        pack.ProcessInstrumentation.Should().NotBeNull();
        pack.ProcessInstrumentation.DemoRunId.Should().Be(HarnessDemoBaselineSupport.DemoRunId);
        pack.ExplainabilityTrace.Should().NotBeNull();
        pack.GovernanceOutcomes.Should().NotBeNull();
        pack.GovernanceOutcomes.PendingApprovalCount.Should().BeGreaterThanOrEqualTo(0);
    }
}
