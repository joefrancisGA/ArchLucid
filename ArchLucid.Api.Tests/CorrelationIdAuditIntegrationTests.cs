using System.Net.Http;
using System.Threading.Tasks;
using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.Middleware;
using ArchLucid.TestSupport;
using FluentAssertions;
using Microsoft.Data.SqlClient;
using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     <c>dbo.AuditEvents</c> exists only after DbUp on a SQL-backed catalog. <see cref="ArchLucidApiFactory" /> forces
///     <c>ArchLucid:StorageProvider=InMemory</c>, so end-to-end correlation-id SQL assertions belong on
///     <see cref="GreenfieldSqlApiFactory" />.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class CorrelationIdAuditIntegrationTests
{
    private const string SqlUnavailable =
        "API greenfield SQL tests need SQL Server. Set "
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

        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        await HealthReadyProbe.EnsureReadyAsync(client);

        string expectedCorrelationId = "test-corr-id-" + Guid.NewGuid().ToString("N");

        // POST /v1/diagnostics/synthetic-operator-demo-pack writes AuditEventTypes.SyntheticOperatorDemoPackInvoked
        // with CorrelationId = HttpContext.TraceIdentifier, which CorrelationIdMiddleware sources from X-Correlation-ID.
        HttpRequestMessage request = new(HttpMethod.Post, "/v1/diagnostics/synthetic-operator-demo-pack");
        request.Headers.Add(CorrelationIdHeaderParser.HeaderName, expectedCorrelationId);
        request.Headers.Add("X-ArchLucid-Test-Actor", "admin");

        HttpResponseMessage response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

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
