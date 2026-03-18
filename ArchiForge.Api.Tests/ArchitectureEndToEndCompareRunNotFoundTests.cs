using System.Net;
using FluentAssertions;
using Xunit;

namespace ArchiForge.Api.Tests;

public sealed class ArchitectureEndToEndCompareRunNotFoundTests : IntegrationTestBase
{
    public ArchitectureEndToEndCompareRunNotFoundTests(ArchiForgeApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task CompareRunsEndToEnd_WhenRunMissing_Returns404RunNotFound()
    {
        var response = await Client.GetAsync(
            "/v1/architecture/run/compare/end-to-end?leftRunId=missing-left&rightRunId=missing-right");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("run-not-found");
        json.Should().Contain("Run Not Found");
    }
}
