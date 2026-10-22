using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="AgentOutputQualityGateOptions" /> after configuration binding.</summary>
public sealed class AgentOutputQualityGateOptionsNormalizePostConfigure
    : IPostConfigureOptions<AgentOutputQualityGateOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, AgentOutputQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.PerAgentTypeFloors = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeys(
            options.PerAgentTypeFloors)
            ?? options.PerAgentTypeFloors;
    }
}
