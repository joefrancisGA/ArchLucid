namespace ArchLucid.Application.Architecture;

/// <summary>
///     Test-only verifier that accepts any non-empty token.
///     Production hosts must register <see cref="TurnstileQuickScanBotChallengeVerifier" />.
/// </summary>
public sealed class PermissiveQuickScanBotChallengeVerifier : IQuickScanBotChallengeVerifier
{
    /// <inheritdoc />
    public Task<bool> VerifyAsync(string? botChallengeToken, CancellationToken cancellationToken = default) =>
        Task.FromResult(!string.IsNullOrWhiteSpace(botChallengeToken));
}
