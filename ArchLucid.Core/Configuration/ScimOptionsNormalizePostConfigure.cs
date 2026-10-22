using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="ScimOptions" /> after configuration binding.</summary>
public sealed class ScimOptionsNormalizePostConfigure : IPostConfigureOptions<ScimOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, ScimOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.GroupRoleMappingOverrides = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeysAndStringValues(
            options.GroupRoleMappingOverrides)
            ?? options.GroupRoleMappingOverrides;
    }
}
