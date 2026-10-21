using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="AgentPromptCatalogOptions" /> after configuration binding.</summary>
public sealed class AgentPromptCatalogOptionsNormalizePostConfigure : IPostConfigureOptions<AgentPromptCatalogOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, AgentPromptCatalogOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.Versions = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeysAndStringValues(options.Versions)
            ?? options.Versions;
    }
}
