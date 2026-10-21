using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="LlmCostEstimationOptions" /> after configuration binding.</summary>
public sealed class LlmCostEstimationOptionsNormalizePostConfigure : IPostConfigureOptions<LlmCostEstimationOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, LlmCostEstimationOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.Deployments = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeys(options.Deployments)
            ?? options.Deployments;
    }
}
