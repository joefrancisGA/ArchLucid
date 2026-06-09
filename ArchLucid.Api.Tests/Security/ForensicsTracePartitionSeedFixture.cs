using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     One greenfield SQL catalog + executed run shared by <see cref="ForensicsTracePartitionIntegrationTests" />
///     so three read-only probes do not each cold-boot DbUp and POST /v1/architecture/request.
/// </summary>
public sealed class ForensicsTracePartitionSeedFixture : IAsyncLifetime
{
    internal bool SqlReachable
    {
        get;
        private set;
    }

    internal GreenfieldSqlApiFactory? SeedFactory
    {
        get;
        private set;
    }

    internal string? ExecutedRunId
    {
        get;
        private set;
    }

    public async Task InitializeAsync()
    {
        SqlReachable = AuditTrailCommitIntegrityIntegrationTestsHelpers.IsSqlReachable();

        if (!SqlReachable)
            return;

        SeedFactory = new GreenfieldSqlApiFactory();
        ExecutedRunId = await CreateExecutedRunAsync(SeedFactory);
    }

    public async Task DisposeAsync()
    {
        if (SeedFactory is not null)
            await SeedFactory.DisposeAsync();
    }

    private static async Task<string> CreateExecutedRunAsync(GreenfieldSqlApiFactory factory)
    {
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
                primer,
                includePostCreateRunWarmup: false);
        }

        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string requestId = "REQ-FORENSICS-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage createResponse =
            await ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
                client,
                TestRequestFactory.CreateArchitectureRequest(requestId),
                "forensics-create-" + Guid.NewGuid().ToString("N"),
                maxAttempts: 20);

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runId = created!.Run.RunId;

        await EnsureExecuteSuccessAsync(client, runId);

        return runId;
    }

    private static async Task EnsureExecuteSuccessAsync(HttpClient client, string runId)
    {
        int delayMs = 250;

        for (int attempt = 0; attempt < 10; attempt++)
        {
            HttpResponseMessage response = await client.PostAsync($"/v1/architecture/run/{runId}/execute", null);

            if (response.IsSuccessStatusCode)
            {
                response.Dispose();
                return;
            }

            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
            {
                await response.EnsureSuccessForTestAsync();
                return;
            }

            response.Dispose();
            await Task.Delay(delayMs);
            delayMs = Math.Min(delayMs * 2, 4000);
        }

        throw new InvalidOperationException(
            "POST /v1/architecture/run/{runId}/execute did not succeed after transient SQL retries.");
    }
}
