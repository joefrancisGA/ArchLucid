using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Evidence.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureEvidenceTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetRunEvidence_ReturnsEvidencePackageAfterExecute()
    {
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        string expectedSystemName = TestRequestFactory.SystemNameForRequest(created.RequestId);
        string runId = created.RunId;
        HttpResponseMessage evidenceResponse = await Client.GetAsync($"/v1/architecture/review/{runId}/evidence");        AgentEvidencePackageResponse? payload =
            await evidenceResponse.ReadJsonForTestAsync<AgentEvidencePackageResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Evidence.RunId.Should().Be(runId);
        payload.Evidence.SystemName.Should().Be($"<untrusted_input>{expectedSystemName}</untrusted_input>");
        payload.Evidence.Request.Description.Should().Contain("secure Azure RAG system");
        payload.Evidence.Policies.Should().NotBeEmpty();
        payload.Evidence.ServiceCatalog.Should().NotBeEmpty();
    }
}
