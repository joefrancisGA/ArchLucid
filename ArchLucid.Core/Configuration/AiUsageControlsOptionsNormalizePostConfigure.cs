using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="AiUsageControlsOptions" /> after configuration binding.</summary>
public sealed class AiUsageControlsOptionsNormalizePostConfigure : IPostConfigureOptions<AiUsageControlsOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, AiUsageControlsOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.PublicDemoFeatureDailyLimitUsd = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeys(
            options.PublicDemoFeatureDailyLimitUsd)
            ?? options.PublicDemoFeatureDailyLimitUsd;
    }
}
