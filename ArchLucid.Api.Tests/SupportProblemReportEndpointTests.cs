using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Support;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Support problem report HTTP tests. Raw <see cref="Microsoft.Data.SqlClient.SqlConnection" /> probes require
///     <see cref="GreenfieldSqlApiFactory" /> (Sql + DbUp); <see cref="ArchLucidApiFactory" /> keeps InMemory storage.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class SupportProblemReportEndpointTests
{
    private const string EndpointPath = "/v1/support/problem-reports";

    private static readonly Guid TenantB = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid WorkspaceB = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ProjectB = Guid.Parse("66666666-6666-6666-6666-666666666666");

    [SkippableFact]
    public async Task Post_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            EndpointPath,
            BuildValidRequest());

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Post_with_reader_role_returns_forbidden()
    {
        await using ReaderRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(EndpointPath, BuildValidRequest());

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Post_without_consent_returns_bad_request()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        SubmitSupportProblemReportRequest request = BuildValidRequest();
        request.ConsentGranted = false;

        using HttpResponseMessage response = await client.PostAsJsonAsync(EndpointPath, request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Post_with_attach_support_bundle_returns_accepted_and_persists_blob_path()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        SubmitSupportProblemReportRequest request = BuildValidRequest();
        request.AttachSupportBundle = true;

        using HttpResponseMessage response = await client.PostAsJsonAsync(EndpointPath, request);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);

        SubmitSupportProblemReportResponse? body =
            await response.Content.ReadFromJsonAsync<SubmitSupportProblemReportResponse>();

        body.Should().NotBeNull();
        body!.SupportBundleAttached.Should().BeTrue();
        body.SupportBundleAttachWarning.Should().BeNull();

        string? blobPath = await ReadSupportBundleBlobPathAsync(factory.SqlConnectionString, body.ReferenceId);

        blobPath.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public async Task Post_with_operator_role_returns_accepted_reference()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(EndpointPath, BuildValidRequest());

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);

        SubmitSupportProblemReportResponse? body =
            await response.Content.ReadFromJsonAsync<SubmitSupportProblemReportResponse>();

        body.Should().NotBeNull();
        body!.ReferenceId.Should().NotBe(Guid.Empty);
        body.SlaMessage.Should().Be("We'll respond by the next business day.");

        SupportProblemReportRow? row = await ReadReportRowAsync(factory.SqlConnectionString, body.ReferenceId);

        row.Should().NotBeNull();
        row!.TenantId.Should().Be(ScopeIds.DefaultTenant);
        row.WorkspaceId.Should().Be(ScopeIds.DefaultWorkspace);
        row.Status.Should().Be("Open");
        row.CorrelationId.Should().Be("corr-test-1");
    }

    [SkippableFact]
    public async Task Post_row_is_not_visible_under_other_tenant_scope()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(EndpointPath, BuildValidRequest());

        SubmitSupportProblemReportResponse? body =
            await response.Content.ReadFromJsonAsync<SubmitSupportProblemReportResponse>();

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        SupportProblemReportRow? row = await ReadReportRowForTenantAsync(
            factory.SqlConnectionString,
            TenantB,
            body!.ReferenceId);

        row.Should().BeNull("reports are tenant-scoped; other tenants must not see the row.");
    }

    private static SubmitSupportProblemReportRequest BuildValidRequest()
    {
        return new SubmitSupportProblemReportRequest
        {
            ConsentGranted = true,
            OperatorNote = "Could not load review detail.",
            Context = new ReportProblemContextDto
            {
                TenantId = ScopeIds.DefaultTenant.ToString("D"),
                WorkspaceId = ScopeIds.DefaultWorkspace.ToString("D"),
                RoutePath = "/reviews/run-1",
                CorrelationId = "corr-test-1",
                ErrorTitle = "Load failed",
                ErrorCode = "500"
            }
        };
    }

    private static async Task<string?> ReadSupportBundleBlobPathAsync(string connectionString, Guid reportId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            SELECT TOP 1 SupportBundleBlobPath
            FROM dbo.SupportProblemReports
            WHERE Id = @Id;
            """;
        cmd.Parameters.AddWithValue("@Id", reportId);

        object? scalar = await cmd.ExecuteScalarAsync();

        return scalar is DBNull or null ? null : Convert.ToString(scalar);
    }

    private static async Task<SupportProblemReportRow?> ReadReportRowAsync(string connectionString, Guid reportId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            SELECT TOP 1 TenantId, WorkspaceId, Status, CorrelationId
            FROM dbo.SupportProblemReports
            WHERE Id = @Id;
            """;
        cmd.Parameters.AddWithValue("@Id", reportId);

        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new SupportProblemReportRow
        {
            TenantId = reader.GetGuid(0),
            WorkspaceId = reader.GetGuid(1),
            Status = reader.GetString(2),
            CorrelationId = reader.IsDBNull(3) ? null : reader.GetString(3)
        };
    }

    private static async Task<SupportProblemReportRow?> ReadReportRowForTenantAsync(
        string connectionString,
        Guid tenantId,
        Guid reportId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            SELECT TOP 1 TenantId, WorkspaceId, Status, CorrelationId
            FROM dbo.SupportProblemReports
            WHERE TenantId = @TenantId
              AND Id = @Id;
            """;
        cmd.Parameters.AddWithValue("@TenantId", tenantId);
        cmd.Parameters.AddWithValue("@Id", reportId);

        await using SqlDataReader reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new SupportProblemReportRow
        {
            TenantId = reader.GetGuid(0),
            WorkspaceId = reader.GetGuid(1),
            Status = reader.GetString(2),
            CorrelationId = reader.IsDBNull(3) ? null : reader.GetString(3)
        };
    }

    private static async Task EnsureAlternateTenantAndWorkspaceAsync(
        string connectionString,
        Guid tenantId,
        Guid workspaceId,
        Guid defaultProjectId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, N'Tenant isolation B', N'tenant-iso-b', N'Standard', NULL);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, N'Workspace B', @Pid);
            IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @Pid)
                INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                VALUES (@Pid, @Tid, @Wid, N'default', SYSUTCDATETIME(), 0);
            """;
        cmd.Parameters.AddWithValue("@Tid", tenantId);
        cmd.Parameters.AddWithValue("@Wid", workspaceId);
        cmd.Parameters.AddWithValue("@Pid", defaultProjectId);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    private sealed class SupportProblemReportRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public string? CorrelationId
        {
            get;
            init;
        }
    }
}
