using System.Net.Http.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <summary>Cloudflare Turnstile verifier for Quick Scan progressive CAPTCHA (TB-897).</summary>
public sealed class TurnstileQuickScanBotChallengeVerifier(
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<EmailOtpAuthOptions> emailOtpOptions) : IQuickScanBotChallengeVerifier
{
    private const string SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IOptionsMonitor<EmailOtpAuthOptions> _emailOtpOptions =
        emailOtpOptions ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    /// <inheritdoc />
    public async Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(botChallengeToken))
            return false;

        string secret = _emailOtpOptions.CurrentValue.BotChallenge.SecretKey?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(secret))
            return false;

        using HttpRequestMessage request = new(HttpMethod.Post, SiteVerifyUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["secret"] = secret,
                ["response"] = botChallengeToken.Trim(),
            }),
        };

        HttpClient client = _httpClientFactory.CreateClient(nameof(TurnstileQuickScanBotChallengeVerifier));
        using HttpResponseMessage response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
            return false;

        TurnstileSiteVerifyResponse? payload =
            await response.Content.ReadFromJsonAsync<TurnstileSiteVerifyResponse>(cancellationToken).ConfigureAwait(false);

        return payload?.Success == true;
    }

    private sealed class TurnstileSiteVerifyResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }
    }
}
