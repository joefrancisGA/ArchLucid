using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="AgentModelTierOptions" /> after configuration binding.</summary>
public sealed class AgentModelTierOptionsNormalizePostConfigure : IPostConfigureOptions<AgentModelTierOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, AgentModelTierOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.AgentTypeTiers = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeysAndStringValues(
            options.AgentTypeTiers)
            ?? options.AgentTypeTiers;
    }
}
