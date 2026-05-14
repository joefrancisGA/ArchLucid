namespace ArchLucid.Notifications;

/// <summary>
///     Verifies that an inbound Slack interactivity request is authentic using HMAC-SHA256
///     as documented at https://api.slack.com/authentication/verifying-requests-from-slack.
/// </summary>
public interface ISlackInteractivityVerifier
{
    /// <summary>
    ///     Returns <c>true</c> when the <paramref name="signature" /> header matches the expected HMAC over
    ///     <paramref name="rawBody" /> and the request is within the allowed time window.
    /// </summary>
    bool Verify(string rawBody, string timestamp, string signature);
}
