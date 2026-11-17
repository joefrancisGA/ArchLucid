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
        AgentEvidencePackageResponse payload = await created.GetEvidenceAsync(Client, JsonOptions);
        payload.Evidence.RunId.Should().Be(created.RunId);
        payload.Evidence.SystemName.Should().Be($"<untrusted_input>{created.SystemName}</untrusted_input>");
        payload.Evidence.Request.Description.Should().Contain("secure Azure RAG system");
        payload.Evidence.Policies.Should().NotBeEmpty();
        payload.Evidence.ServiceCatalog.Should().NotBeEmpty();
    }
}
