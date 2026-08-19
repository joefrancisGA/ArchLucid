using System.Net.Http.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

/// <summary>Verifies Cloudflare Turnstile tokens server-side.</summary>
public sealed class TurnstileEmailOtpBotChallengeVerifier(
    IHttpClientFactory httpClientFactory,
    IOptions<EmailOtpAuthOptions> options)
{
    private const string SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly EmailOtpAuthOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public async Task<bool> VerifyAsync(string botChallengeToken, CancellationToken cancellationToken)
    {
        string secret = _options.BotChallenge.SecretKey.Trim();

        if (string.IsNullOrEmpty(secret))
        {
            return false;
        }

        using HttpRequestMessage request = new(HttpMethod.Post, SiteVerifyUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["secret"] = secret,
                ["response"] = botChallengeToken.Trim()
            })
        };

        HttpClient client = _httpClientFactory.CreateClient(nameof(TurnstileEmailOtpBotChallengeVerifier));
        using HttpResponseMessage response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        TurnstileSiteVerifyResponse? payload =
            await response.Content.ReadFromJsonAsync<TurnstileSiteVerifyResponse>(cancellationToken).ConfigureAwait(false);

        return payload?.Success == true;
    }

    private sealed class TurnstileSiteVerifyResponse
    {
        [JsonPropertyName("success")]
        public bool Success
        {
            get;
            init;
        }
    }
}
