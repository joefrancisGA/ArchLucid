using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Applies <see cref="StagedCriticAgentOptions.Normalize" /> after configuration binding.</summary>
public sealed class StagedCriticAgentOptionsNormalizePostConfigure : IPostConfigureOptions<StagedCriticAgentOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, StagedCriticAgentOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.Normalize();
    }
}
