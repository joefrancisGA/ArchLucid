using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Admin;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class UsersAdminInvitationEndpointTests
{
    private const string InvitePath = "/v1/admin/users/invite";
    private const string ListPath = "/v1/admin/users/invitations";

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
}
