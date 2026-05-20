using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Configuration;

public sealed class KnowledgeGraphProjectionCacheOptionsValidator : IValidateOptions<KnowledgeGraphProjectionCacheOptions>
{
    public ValidateOptionsResult Validate(string? name, KnowledgeGraphProjectionCacheOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        if (options.AbsoluteExpirationSeconds < 1)
        {
            return ValidateOptionsResult.Fail(
                $"{KnowledgeGraphProjectionCacheOptions.SectionName}: "
                + $"{nameof(KnowledgeGraphProjectionCacheOptions.AbsoluteExpirationSeconds)} must be at least 1.");
        }

        if (options.AbsoluteExpirationSeconds > options.MaxAbsoluteExpirationSeconds)
        {
            return ValidateOptionsResult.Fail(
                $"{KnowledgeGraphProjectionCacheOptions.SectionName}: "
                + $"{nameof(KnowledgeGraphProjectionCacheOptions.AbsoluteExpirationSeconds)} "
                + $"({options.AbsoluteExpirationSeconds}) must not exceed "
                + $"{nameof(KnowledgeGraphProjectionCacheOptions.MaxAbsoluteExpirationSeconds)} "
                + $"({options.MaxAbsoluteExpirationSeconds}).");
        }

        return ValidateOptionsResult.Success;
    }
}