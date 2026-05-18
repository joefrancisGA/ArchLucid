using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Api.Tests;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.ValueReports;

[Trait("Category", "Integration")]
public sealed class ValueReportControllerIntegrationTests : IAsyncLifetime
{
    private readonly ValueReportJwtWebAppFactory _factory = new();

    /// <summary>
    ///     One <see cref="WebApplicationFactory{TEntryPoint}" /> instance for both JWT signing keys and host extras
    ///     (avoids deriving only via <c>WithWebHostBuilder</c>, where config/DI split across two factories is easy to get
    ///     wrong in CI).
    /// </summary>
    private sealed class ValueReportJwtWebAppFactory : JwtLocalSigningWebAppFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ValueReport:Computation:AsyncJobWhenWindowDaysExceeds"] = "5000",
                    ["Demo:Enabled"] = "false",
                    ["Demo:SeedOnStartup"] = "false",
                    ["DataConsistency:InitialDelaySeconds"] = "0",
                    ["HostLeaderElection:Enabled"] = "false"
                }));

            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IValueReportMetricsReader>();
                services.AddSingleton<IValueReportMetricsReader, StubValueReportMetricsReader>();
            });
        }
    }

    public async Task InitializeAsync()
    {
        using IServiceScope scope = _factory.Services.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();

        if (await tenants.GetByIdAsync(ScopeIds.DefaultTenant, CancellationToken.None) is not null)
            return;

        await tenants.InsertTenantAsync(
            ScopeIds.DefaultTenant,
            "Value report test tenant",
            "valuereporttest",
            TenantTier.Standard,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
    }

    public Task DisposeAsync()
    {
        _factory.Dispose();

        return Task.CompletedTask;
    }

    [SkippableFact]
    public async Task Post_generate_returns_docx_when_operator_jwt_and_standard_tier()
    {
        string token = _factory.MintLocalBearerJwt("OperatorUser", [ArchLucidRoles.Operator]);

        HttpClient client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        Uri url = new(
            $"/v1/value-report/{ScopeIds.DefaultTenant:D}/generate?from=2026-01-01T00:00:00.0000000Z&to=2026-01-10T00:00:00.0000000Z",
            UriKind.Relative);

        using HttpResponseMessage res = await client.PostAsync(url, null);

        string responseBody = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);
        res.Content.Headers.ContentType?.MediaType.Should()
            .Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        byte[] body = await res.Content.ReadAsByteArrayAsync();
        body.Should().NotBeEmpty();
    }

    private sealed class StubValueReportMetricsReader : IValueReportMetricsReader
    {
        public Task<ValueReportRawMetrics> ReadAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            DateTimeOffset fromUtcInclusive,
            DateTimeOffset toUtcExclusive,
            CancellationToken cancellationToken)
        {
            _ = tenantId;
            _ = workspaceId;
            _ = projectId;
            _ = fromUtcInclusive;
            _ = toUtcExclusive;
            _ = cancellationToken;

            ValueReportRawMetrics raw = new(
                [new ValueReportRunStatusCount("Completed", 1)],
                1,
                1,
                1,
                1,
                0,
                0,
                null,
                null,
                null,
                null,
                0,
                null,
                null,
                null);

            return Task.FromResult(raw);
        }
    }
}
