using System.Security.Cryptography;
using System.Text;

using Microsoft.Extensions.Options;

namespace ArchLucid.Notifications;

/// <summary>
///     Verifies Slack request signatures per https://api.slack.com/authentication/verifying-requests-from-slack.
///     Signature: <c>v0=HMAC-SHA256(signingSecret, "v0:{timestamp}:{rawBody}")</c>.
///     Replay window: rejects requests older than 5 minutes.
/// </summary>
public sealed class SlackInteractivityVerifier(
    IOptionsMonitor<ChatOpsIncomingWebhooksOptions> optionsMonitor,
    TimeProvider timeProvider) : ISlackInteractivityVerifier
{
    private const int MaxRequestAgeSeconds = 300;
    private const string VersionPrefix = "v0=";
    private const string SignatureVersion = "v0";

    private readonly IOptionsMonitor<ChatOpsIncomingWebhooksOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public bool Verify(string rawBody, string timestamp, string signature)
    {
        if (string.IsNullOrWhiteSpace(rawBody))
            return false;

        if (string.IsNullOrWhiteSpace(timestamp))
            return false;

        if (string.IsNullOrWhiteSpace(signature))
            return false;

        string? signingSecret = _optionsMonitor.CurrentValue.SlackSigningSecret;

        if (string.IsNullOrWhiteSpace(signingSecret))
            return false;

        if (!long.TryParse(timestamp, out long requestEpoch))
            return false;

        long nowEpoch = _timeProvider.GetUtcNow().ToUnixTimeSeconds();

        // Reject replayed requests outside the 5-minute window.
        if (Math.Abs(nowEpoch - requestEpoch) > MaxRequestAgeSeconds)
            return false;

        string baseString = $"{SignatureVersion}:{timestamp}:{rawBody}";
        byte[] keyBytes = Encoding.UTF8.GetBytes(signingSecret);
        byte[] messageBytes = Encoding.UTF8.GetBytes(baseString);
        byte[] hash = HMACSHA256.HashData(keyBytes, messageBytes);
        string expected = $"{VersionPrefix}{Convert.ToHexString(hash).ToLowerInvariant()}";

        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(expected),
            Encoding.ASCII.GetBytes(signature));
    }
}
