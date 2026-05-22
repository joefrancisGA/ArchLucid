using System.Net.Http;
using System.Threading.Tasks;
using ArchLucid.Core.Audit;
using ArchLucid.TestSupport;
using FluentAssertions;
using Microsoft.Data.SqlClient;
using Xunit;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class CorrelationIdAuditIntegrationTests
{
    private const string SqlUnavailable =
        "API integration tests need SQL Server. Set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " (see docs/BUILD.md), or use Windows with LocalDB.";

    private static bool IsSqlServerConfiguredForApiIntegration()
    {
        if (!string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable)))
            return true;

        return !string.IsNullOrWhiteSpace(
                   Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)) ||
               OperatingSystem.IsWindows();
    }

    [SkippableFact]
    public async Task RequestWithXCorrelationId_PropagatesToDurableAuditEvent()
    {
        Skip.IfNot(IsSqlServerConfiguredForApiIntegration(), SqlUnavailable);

        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await HealthReadyProbe.EnsureReadyAsync(client);

        string expectedCorrelationId = "test-corr-id-" + Guid.NewGuid().ToString("N");
        
        // We need to trigger an endpoint that generates an audit event.
        // For example, GET /v1/health/ready doesn't generate an audit event.
        // Let's trigger a quick scan or something that generates an audit event.
        // Or we can use POST /v1/architecture/quick-scan
        // Wait, we can just use a simple endpoint that logs an audit event, like POST /v1/diagnostics/synthetic-operator-demo-pack
        // Or we can just use GET /v1/admin/tenants ? No, list doesn't audit.
        
        // Let's use GET /v1/health/ready and see if it audits? No.
        // Let's use POST /v1/diagnostics/synthetic-operator-demo-pack
        var request = new HttpRequestMessage(HttpMethod.Post, "/v1/diagnostics/synthetic-operator-demo-pack");
        request.Headers.Add("X-Correlation-ID", expectedCorrelationId);
        request.Headers.Add("X-ArchLucid-Test-Actor", "admin"); // Need admin rights for diagnostics
        
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        // Now check the database for the audit event
        await using SqlConnection connection = new(factory.SqlConnectionString);
        await connection.OpenAsync(CancellationToken.None);
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT TOP (1) CorrelationId
            FROM dbo.AuditEvents
            WHERE EventType = @eventType AND CorrelationId = @correlationId
            ORDER BY OccurredUtc DESC
            """;
        command.Parameters.AddWithValue("@eventType", AuditEventTypes.SyntheticOperatorDemoPackInvoked);
        command.Parameters.AddWithValue("@correlationId", expectedCorrelationId);
        
        object? correlation = await command.ExecuteScalarAsync(CancellationToken.None);
        
        correlation.Should().NotBeNull();
        correlation!.ToString().Should().Be(expectedCorrelationId);
    }
}
