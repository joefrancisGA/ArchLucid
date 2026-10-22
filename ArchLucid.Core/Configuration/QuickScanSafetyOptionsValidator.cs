using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Fail-closed validation for <see cref="QuickScanSafetyOptions" /> (TB-892).
///     Production/SaaS hosts reject anonymous execution without mandatory spend, token, concurrency, and model guardrails.
/// </summary>
public sealed partial class QuickScanSafetyOptionsValidator(
    IHostEnvironment hostEnvironment,
    IConfiguration configuration) : IValidateOptions<QuickScanSafetyOptions>
{
    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, QuickScanSafetyOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        List<string> failures = [];
        QuickScanSafetyEffectiveFeatureState effective = options.ResolveEffectiveFeatureState();

        ValidateFeatureState(options, failures);
        ValidatePerRequest(options.PerRequest, failures);
        ValidateConcurrency(options.Concurrency, failures);
        ValidateIdentity(options.Identity, failures);
        ValidateGlobalRequests(options.GlobalRequests, failures);
        ValidateGlobalBudget(options.GlobalBudget, failures);
        ValidateProgressiveFriction(options.ProgressiveFriction, failures);
        ValidateModels(options.Models, effective, failures);
        ValidateAbuse(options.Abuse, failures);
        ValidateTelemetry(options.Telemetry, failures);

        if (RequiresProductionLikeAnonymousGuardrails() && effective.AnonymousExecutionEnabled)
        {
            ValidateProductionLikeAnonymousRequirements(options, failures);
        }

        if (failures.Count > 0)
        {
            return ValidateOptionsResult.Fail(failures);
        }

        return ValidateOptionsResult.Success;
    }

    private static void AppendPositive(List<string> failures, int value, string fieldName)
    {
        if (value <= 0)
        {
            failures.Add($"{fieldName} must be greater than zero.");
        }
    }

    private static void AppendNonNegative(List<string> failures, int value, string fieldName)
    {
        if (value < 0)
        {
            failures.Add($"{fieldName} must be greater than or equal to zero.");
        }
    }

    private static void AppendNonNegativeMoney(List<string> failures, decimal value, string fieldName)
    {
        if (value < 0m)
        {
            failures.Add($"{fieldName} must be greater than or equal to zero.");
        }
    }

    private const string Prefix = QuickScanSafetyOptions.SectionPath;
}
