using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     JWT + in-memory storage: <see cref="CustomerNotificationChannelPreferencesController" /> returns defaults when
///     no SQL row.
/// </summary>
[Trait("Category", "Integration")]
public sealed class CustomerNotificationChannelPreferencesIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public async Task Get_customer_channel_preferences_with_reader_jwt_returns_unconfigured_defaults()
    {
        string token = factory.MintLocalBearerJwt(
            "ReaderUser",
            [ArchLucidRoles.Reader]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage res =
            await client.GetAsync(new Uri("/v1/notifications/customer-channel-preferences", UriKind.Relative));

        string responseBody = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, "response body: {0}", responseBody);
        TenantNotificationChannelPreferencesResponse? body =
            await res.Content.ReadFromJsonAsync<TenantNotificationChannelPreferencesResponse>(JsonOptions);

        body.Should().NotBeNull();
        body.IsConfigured.Should().BeFalse();
        body.EmailCustomerNotificationsEnabled.Should().BeTrue();
        body.TeamsCustomerNotificationsEnabled.Should().BeFalse();
        body.OutboundWebhookCustomerNotificationsEnabled.Should().BeFalse();
        body.SchemaVersion.Should().Be(1);
    }
}
