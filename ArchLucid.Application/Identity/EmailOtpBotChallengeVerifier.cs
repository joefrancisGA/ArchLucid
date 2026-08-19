using System.Net.Http.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

/// <summary>Routes bot challenge verification to the configured provider.</summary>
public sealed class EmailOtpBotChallengeVerifier(
    IOptions<EmailOtpAuthOptions> options,
    TurnstileEmailOtpBotChallengeVerifier turnstileVerifier) : IEmailOtpBotChallengeVerifier
{
    private readonly EmailOtpAuthOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly TurnstileEmailOtpBotChallengeVerifier _turnstileVerifier =
        turnstileVerifier ?? throw new ArgumentNullException(nameof(turnstileVerifier));

    public Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken)
    {
        if (!_options.RequireBotChallenge)
        {
            return Task.FromResult(true);
        }

        if (string.IsNullOrWhiteSpace(botChallengeToken))
        {
            return Task.FromResult(false);
        }

        if (_options.BotChallenge.Provider == EmailOtpBotChallengeProvider.Turnstile)
        {
            return _turnstileVerifier.VerifyAsync(botChallengeToken, cancellationToken);
        }

        return Task.FromResult(false);
    }
}
