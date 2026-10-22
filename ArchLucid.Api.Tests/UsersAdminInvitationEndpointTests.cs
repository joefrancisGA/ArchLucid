using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Admin invitation HTTP tests. Raw <see cref="Microsoft.Data.SqlClient.SqlConnection" /> helpers require
///     <see cref="GreenfieldSqlApiFactory" /> (Sql + DbUp); <see cref="ArchLucidApiFactory" /> keeps InMemory storage.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class UsersAdminInvitationEndpointTests
{
    private const string InvitePath = "/v1/admin/users/invite";
    private const string ListPath = "/v1/admin/users/invitations";

    private static readonly Guid TenantB = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid WorkspaceB = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ProjectB = Guid.Parse("66666666-6666-6666-6666-666666666666");

    [SkippableFact]
    public async Task PostInvite_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = "reviewer@example.com", AppRole = "Reader" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task GetInvitations_anonymous_returns_unauthorized()
    {
        await using HealthEndpointSecurityApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        WireScopeHeaders(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        using HttpResponseMessage response = await client.GetAsync(ListPath);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task PostInvite_WithReaderRole_Returns403()
    {
        await using ReaderRoleArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = "reviewer@example.com", AppRole = "Reader" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Operator")]
    [InlineData("Reader")]
    [InlineData("Auditor")]
    public async Task PostInvite_WithAssignableRole_ReturnsPendingInvitation(string appRole)
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string email = $"role-{appRole.ToLowerInvariant()}-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = appRole });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        UserInvitationResponse? body = await response.Content.ReadFromJsonAsync<UserInvitationResponse>();

        body.Should().NotBeNull();
        body!.AppRole.Should().Be(appRole);
        body.Status.Should().Be("Pending");
    }

    [SkippableFact]
    public async Task PostInvite_WithAdminRole_ReturnsInvitationRecord()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string email = $"invite-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader", Message = "Welcome aboard" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        UserInvitationResponse? body = await response.Content.ReadFromJsonAsync<UserInvitationResponse>();

        body.Should().NotBeNull();
        body!.Email.Should().Be(email.ToLowerInvariant());
        body.AppRole.Should().Be("Reader");
        body.Status.Should().Be("Pending");
        body.Id.Should().NotBe(Guid.Empty);
        body.ExpiresUtc.Should().BeAfter(body.CreatedUtc);
    }

    [SkippableFact]
    public async Task PostInvite_WithDuplicatePendingEmail_IsIdempotent()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string email = $"dup-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage first = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Auditor" });

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        UserInvitationResponse? firstBody = await first.Content.ReadFromJsonAsync<UserInvitationResponse>();

        using HttpResponseMessage second = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Auditor" });

        second.StatusCode.Should().Be(HttpStatusCode.OK);
        UserInvitationResponse? secondBody = await second.Content.ReadFromJsonAsync<UserInvitationResponse>();

        secondBody!.Id.Should().Be(firstBody!.Id);
    }

    [SkippableFact]
    public async Task PostInvite_WithInvalidEmail_Returns400()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = "not-an-email", AppRole = "Reader" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetInvitations_WithAdminRole_ReturnsCreatedInvite()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string email = $"listed-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Operator" });

        create.StatusCode.Should().Be(HttpStatusCode.OK);
        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        using HttpResponseMessage list = await client.GetAsync(ListPath);

        list.StatusCode.Should().Be(HttpStatusCode.OK);

        UserInvitationListResponse? body = await list.Content.ReadFromJsonAsync<UserInvitationListResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        body.Should().NotBeNull();
        body!.Invitations.Should().Contain(invite => invite.Id == created!.Id && invite.Email == email.ToLowerInvariant());
    }

    [SkippableFact]
    public async Task DeleteInvitation_WithAdminRole_RevokesPendingInvite()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        string email = $"revoke-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        using HttpResponseMessage revoke = await client.DeleteAsync(
            $"/v1/admin/users/invitations/{created!.Id}");

        revoke.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using HttpResponseMessage list = await client.GetAsync(ListPath);
        UserInvitationListResponse? body = await list.Content.ReadFromJsonAsync<UserInvitationListResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        body!.Invitations.Single(invite => invite.Id == created.Id).Status.Should().Be("Revoked");
    }

    [SkippableFact]
    public async Task GetInvitations_WithExpiredPendingInvite_ReturnsExpiredStatus()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        string email = $"expired-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        await ExpireInvitationAsync(factory.SqlConnectionString, created!.Id);

        using HttpResponseMessage list = await client.GetAsync(ListPath);
        UserInvitationListResponse? body = await list.Content.ReadFromJsonAsync<UserInvitationListResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        body!.Invitations.Single(invite => invite.Id == created.Id).Status.Should().Be("Expired");
        body.Invitations.Should().NotContain(invite => invite.Id == created.Id && invite.Status == "Pending");
    }

    [SkippableFact]
    public async Task PostInvite_ToExistingDirectoryUser_Returns409()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        string email = $"existing-{Guid.NewGuid():N}@example.com";

        await SeedDirectoryUserAsync(factory.SqlConnectionString, ScopeIds.DefaultTenant, email);

        using HttpResponseMessage response = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [SkippableFact]
    public async Task GetInvitations_FromOtherTenant_DoesNotIncludeForeignInvite()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        string email = $"tenant-a-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Remove("x-project-id");
        WireScopeHeaders(client, TenantB, WorkspaceB, ProjectB);

        using HttpResponseMessage list = await client.GetAsync(ListPath);
        UserInvitationListResponse? body = await list.Content.ReadFromJsonAsync<UserInvitationListResponse>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        body!.Invitations.Should().NotContain(invite => invite.Id == created!.Id);
    }

    [SkippableFact]
    public async Task DeleteInvitation_FromOtherTenant_Returns404()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);
        await HealthReadyProbe.EnsureReadyAsync(client);

        string email = $"cross-revoke-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await client.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Remove("x-project-id");
        WireScopeHeaders(client, TenantB, WorkspaceB, ProjectB);

        using HttpResponseMessage revoke = await client.DeleteAsync(
            $"/v1/admin/users/invitations/{created!.Id}");

        revoke.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static void WireScopeHeaders(HttpClient client, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-tenant-id", tenantId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-workspace-id", workspaceId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-project-id", projectId.ToString("D"));
    }

    private static async Task ExpireInvitationAsync(string connectionString, Guid invitationId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            UPDATE dbo.UserInvitations
            SET ExpiresUtc = DATEADD(day, -1, SYSUTCDATETIME())
            WHERE Id = @Id;
            """;
        cmd.Parameters.AddWithValue("@Id", invitationId);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    private static async Task SeedDirectoryUserAsync(string connectionString, Guid tenantId, string email)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.ScimUsers WHERE TenantId = @TenantId AND UserName = @Email)
                INSERT INTO dbo.ScimUsers (Id, TenantId, ExternalId, UserName, DisplayName, Active)
                VALUES (NEWID(), @TenantId, @ExternalId, @Email, @Email, 1);
            """;
        cmd.Parameters.AddWithValue("@TenantId", tenantId);
        cmd.Parameters.AddWithValue("@Email", email.ToLowerInvariant());
        cmd.Parameters.AddWithValue("@ExternalId", Guid.NewGuid().ToString("D"));
        _ = await cmd.ExecuteNonQueryAsync();
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
}
