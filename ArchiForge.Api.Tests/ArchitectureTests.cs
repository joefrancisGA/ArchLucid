using System.Text;
using System.Text.Json;
using FluentAssertions;
using Xunit;

public class ArchitectureTests : IntegrationTestBase
{
    public ArchitectureTests(ArchiForgeApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task CreateArchitectureRun_ShouldReturnRunId()
    {
        var request = new
        {
            requestId = "REQ-TEST-1",
            description = "Test architecture",
            systemName = "TestSystem",
            environment = "dev",
            cloudProvider = 1
        };

        var json = JsonSerializer.Serialize(request);

        var response = await Client.PostAsync(
            "/architecture/request",
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();

        body.Should().Contain("runId");
    }

    [Fact]
    public async Task GoldenPath_ShouldProduceManifest()
    {
        var request = new
        {
            requestId = "REQ-1",
            description = "Test architecture",
            systemName = "TestSystem",
            environment = "dev",
            cloudProvider = 1
        };

        var json = JsonSerializer.Serialize(request);

        var create = await Client.PostAsync(
            "/architecture/request",
            new StringContent(json, Encoding.UTF8, "application/json"));

        create.EnsureSuccessStatusCode();

        var body = await create.Content.ReadAsStringAsync();

        var runId = JsonDocument.Parse(body)
            .RootElement
            .GetProperty("run")
            .GetProperty("runId")
            .GetString();

        var seed = await Client.PostAsync(
            $"/architecture/run/{runId}/seed-fake-results",
            null);

        seed.EnsureSuccessStatusCode();

        var commit = await Client.PostAsync(
            $"/architecture/run/{runId}/commit",
            null);

        commit.EnsureSuccessStatusCode();

        var manifest = await Client.GetAsync(
            "/architecture/manifest/v1");

        manifest.EnsureSuccessStatusCode();
    }
}