using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

/// <summary>Default verifier: passes when bot challenge is disabled; requires a non-empty token when enabled.</summary>
public sealed class PermissiveEmailOtpBotChallengeVerifier(IOptions<EmailOtpAuthOptions> options) : IEmailOtpBotChallengeVerifier
{
    private readonly EmailOtpAuthOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    public Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_options.RequireBotChallenge)
        {
            return Task.FromResult(true);
        }

        return Task.FromResult(!string.IsNullOrWhiteSpace(botChallengeToken));
    }
}
