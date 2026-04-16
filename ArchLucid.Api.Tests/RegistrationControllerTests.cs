using System.Net;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Self-service registration with <see cref="GreenfieldSqlApiFactory"/> (full SQL DI + DbUp + schema bootstrap).</summary>
[Trait("Suite", "Core")]
public sealed class RegistrationControllerTests : IClassFixture<GreenfieldSqlApiFactory>
{
    private readonly GreenfieldSqlApiFactory _fixture;

    public RegistrationControllerTests(GreenfieldSqlApiFactory fixture) => _fixture = fixture;

    [Fact]
    public async Task Register_creates_tenant_then_returns_conflict_for_same_organization()
    {
        using HttpClient client = _fixture.CreateClient();
        string organizationName = "Reg Org " + Guid.NewGuid().ToString("N");

        using HttpResponseMessage created = await client.PostAsync(
            "/v1/register",
            JsonContent(organizationName, "first@example.com", "First User"));

        created.StatusCode.Should().Be(HttpStatusCode.Created);

        using HttpResponseMessage duplicate = await client.PostAsync(
            "/v1/register",
            JsonContent(organizationName, "second@example.com", null));

        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    private static StringContent JsonContent(string organizationName, string adminEmail, string? displayName)
    {
        Dictionary<string, string?> payload = new()
        {
            ["organizationName"] = organizationName,
            ["adminEmail"] = adminEmail,
        };

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            payload["adminDisplayName"] = displayName;
        }

        string json = JsonSerializer.Serialize(payload);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
