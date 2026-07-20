using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Anonymous invitation validate endpoint (TB-793 / auth-routing rate limit policy).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class UserInvitationPublicValidateEndpointTests
{
    private const string InvitePath = "/v1/admin/users/invite";
    private const string ValidatePath = "/v1/auth/invitations/validate";

    [SkippableFact]
    public async Task Validate_missingToken_returns_400_problem_details()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.GetAsync(ValidatePath);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        MvcProblemDetails? problem = await response.Content.ReadFromJsonAsync<MvcProblemDetails>();

        problem.Should().NotBeNull();
        problem!.Status.Should().Be((int)HttpStatusCode.BadRequest);
        problem.Detail.Should().Contain("token");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_emptyToken_returns_400_problem_details(string token)
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.GetAsync($"{ValidatePath}?token={Uri.EscapeDataString(token)}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Validate_unknownToken_returns_200_Invalid()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.GetAsync(
            $"{ValidatePath}?token={Guid.NewGuid():N}{Guid.NewGuid():N}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        InvitationValidationResponseDto? body =
            await response.Content.ReadFromJsonAsync<InvitationValidationResponseDto>();

        body.Should().NotBeNull();
        body!.Status.Should().Be("Invalid");
        body.MaskedInvitedEmail.Should().BeNull();
        body.AppRole.Should().BeNull();
    }

    [SkippableFact]
    public async Task Validate_freshInviteToken_returns_200_Valid_with_masked_email_and_role()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient adminClient = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(adminClient);

        string email = $"validate-valid-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await adminClient.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        create.StatusCode.Should().Be(HttpStatusCode.OK);

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        created.Should().NotBeNull();
        created!.InvitationToken.Should().NotBeNullOrWhiteSpace();

        using HttpClient publicClient = factory.CreateClient();

        using HttpResponseMessage validate = await publicClient.GetAsync(
            $"{ValidatePath}?token={Uri.EscapeDataString(created.InvitationToken!)}");

        validate.StatusCode.Should().Be(HttpStatusCode.OK);

        InvitationValidationResponseDto? body =
            await validate.Content.ReadFromJsonAsync<InvitationValidationResponseDto>();

        body.Should().NotBeNull();
        body!.Status.Should().Be("Valid");
        body.AppRole.Should().Be("Reader");
        body.MaskedInvitedEmail.Should().NotBeNullOrWhiteSpace();
        body.MaskedInvitedEmail.Should().Contain("@example.com");
        body.MaskedInvitedEmail.Should().NotBe(email);
    }

    [SkippableFact]
    public async Task Validate_expiredToken_returns_200_Expired()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient adminClient = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(adminClient);
        await HealthReadyProbe.EnsureReadyAsync(adminClient);

        string email = $"validate-expired-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await adminClient.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Reader" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        await ExpireInvitationAsync(factory.SqlConnectionString, created!.Id);

        using HttpClient publicClient = factory.CreateClient();

        using HttpResponseMessage validate = await publicClient.GetAsync(
            $"{ValidatePath}?token={Uri.EscapeDataString(created.InvitationToken!)}");

        validate.StatusCode.Should().Be(HttpStatusCode.OK);

        InvitationValidationResponseDto? body =
            await validate.Content.ReadFromJsonAsync<InvitationValidationResponseDto>();

        body!.Status.Should().Be("Expired");
    }

    [SkippableFact]
    public async Task Validate_revokedToken_returns_200_Revoked()
    {
        await using ArchLucidApiFactory factory = new();
        using HttpClient adminClient = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(adminClient);

        string email = $"validate-revoked-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await adminClient.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Operator" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        using HttpResponseMessage revoke = await adminClient.DeleteAsync(
            $"/v1/admin/users/invitations/{created!.Id}");

        revoke.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using HttpClient publicClient = factory.CreateClient();

        using HttpResponseMessage validate = await publicClient.GetAsync(
            $"{ValidatePath}?token={Uri.EscapeDataString(created.InvitationToken!)}");

        validate.StatusCode.Should().Be(HttpStatusCode.OK);

        InvitationValidationResponseDto? body =
            await validate.Content.ReadFromJsonAsync<InvitationValidationResponseDto>();

        body!.Status.Should().Be("Revoked");
    }

    [SkippableFact]
    public async Task Validate_acceptedToken_returns_200_Accepted()
    {
        await using GreenfieldSqlApiFactory factory = new();
        using HttpClient adminClient = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(adminClient);
        await HealthReadyProbe.EnsureReadyAsync(adminClient);

        string email = $"validate-accepted-{Guid.NewGuid():N}@example.com";

        using HttpResponseMessage create = await adminClient.PostAsJsonAsync(
            InvitePath,
            new CreateUserInvitationRequest { Email = email, AppRole = "Auditor" });

        UserInvitationResponse? created = await create.Content.ReadFromJsonAsync<UserInvitationResponse>();

        await MarkInvitationAcceptedAsync(factory.SqlConnectionString, created!.Id);

        using HttpClient publicClient = factory.CreateClient();

        using HttpResponseMessage validate = await publicClient.GetAsync(
            $"{ValidatePath}?token={Uri.EscapeDataString(created.InvitationToken!)}");

        validate.StatusCode.Should().Be(HttpStatusCode.OK);

        InvitationValidationResponseDto? body =
            await validate.Content.ReadFromJsonAsync<InvitationValidationResponseDto>();

        body!.Status.Should().Be("Accepted");
    }

    [SkippableFact]
    public async Task Validate_exceeding_auth_routing_rate_limit_returns_429()
    {
        await using AuthRoutingRateLimitArchLucidApiFactory factory = new();
        using HttpClient client = factory.CreateClient();

        string tokenQuery = $"{ValidatePath}?token={Guid.NewGuid():N}";

        using HttpResponseMessage first = await client.GetAsync(tokenQuery);

        first.StatusCode.Should().Be(HttpStatusCode.OK);

        using HttpResponseMessage second = await client.GetAsync(tokenQuery);

        second.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        second.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
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

    private static async Task MarkInvitationAcceptedAsync(string connectionString, Guid invitationId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            UPDATE dbo.UserInvitations
            SET Status = N'Accepted',
                AcceptedUtc = SYSUTCDATETIME()
            WHERE Id = @Id;
            """;
        cmd.Parameters.AddWithValue("@Id", invitationId);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    private sealed class InvitationValidationResponseDto
    {
        public string Status
        {
            get;
            set;
        } = string.Empty;

        public string? MaskedInvitedEmail
        {
            get;
            set;
        }

        public string? AppRole
        {
            get;
            set;
        }
    }

    private sealed class AuthRoutingRateLimitArchLucidApiFactory : ArchLucidApiFactory
    {
        protected override void AddCustomSettings(Dictionary<string, string?> settings)
        {
            base.AddCustomSettings(settings);
            settings["RateLimiting:AuthRouting:PermitLimit"] = "1";
            settings["RateLimiting:AuthRouting:WindowMinutes"] = "15";
            settings["RateLimiting:AuthRouting:QueueLimit"] = "0";
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("RateLimiting:AuthRouting:PermitLimit", "1");
            builder.UseSetting("RateLimiting:AuthRouting:WindowMinutes", "15");
            builder.UseSetting("RateLimiting:AuthRouting:QueueLimit", "0");
        }
    }
}
