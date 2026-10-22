using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

public sealed class EmailOtpAuthOptionsValidator(
    IHostEnvironment hostEnvironment,
    IConfiguration configuration) : IValidateOptions<EmailOtpAuthOptions>
{
    private const int MinimumHashPepperLength = 32;

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public ValidateOptionsResult Validate(string? name, EmailOtpAuthOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled || !RequiresProductionLikeGuardrails())
        {
            return ValidateOptionsResult.Success;
        }

        List<string> failures = [];

        if (string.IsNullOrWhiteSpace(options.HashPepper) || options.HashPepper.Trim().Length < MinimumHashPepperLength)
        {
            failures.Add(
                "Auth:EmailOtp:HashPepper must be at least 32 characters when Email OTP is enabled in production-like environments.");
        }

        if (options.RequireBotChallenge
            && options.BotChallenge.Provider != EmailOtpBotChallengeProvider.None
            && string.IsNullOrWhiteSpace(options.BotChallenge.SecretKey))
        {
            failures.Add(
                "Auth:EmailOtp:BotChallenge:SecretKey is required when RequireBotChallenge is true and a bot challenge provider is configured.");
        }

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }

    private bool RequiresProductionLikeGuardrails() =>
        QuickScanSafetyProductionLikeHostClassification.RequiresProductionLikeAnonymousGuardrails(
            _hostEnvironment,
            _configuration);
}
