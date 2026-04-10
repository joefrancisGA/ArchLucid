using ArchLucid.Core.Authority;
using ArchLucid.Host.Core.Configuration;

using Microsoft.FeatureManagement;

namespace ArchLucid.Host.Core.Authority;

/// <summary>
/// Resolves async authority mode from <see cref="IConfiguration"/> storage provider and feature management.
/// </summary>
public sealed class FeatureManagementAuthorityPipelineModeResolver(
    IFeatureManager featureManager,
    IConfiguration configuration) : IAsyncAuthorityPipelineModeResolver
{
    private readonly IFeatureManager _featureManager =
        featureManager ?? throw new ArgumentNullException(nameof(featureManager));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    /// <inheritdoc />
    public async Task<bool> ShouldQueueContextAndGraphStagesAsync(CancellationToken cancellationToken = default)
    {
        ArchLucidOptions archLucid = ArchLucidConfigurationBridge.ResolveArchLucidOptions(_configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(archLucid.StorageProvider))
            return false;

        if (!ArchLucidOptions.EffectiveIsSql(archLucid.StorageProvider))
            return false;

        return await _featureManager.IsEnabledAsync(AuthorityPipelineFeatureFlags.AsyncAuthorityPipeline, cancellationToken);
    }
}
