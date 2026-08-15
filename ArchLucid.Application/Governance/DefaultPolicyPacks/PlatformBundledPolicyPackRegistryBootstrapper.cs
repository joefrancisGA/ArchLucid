using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>Ensures <c>dbo.PlatformBundledPolicyPackRegistry</c> contains every bundled pack manifest row.</summary>
public sealed class PlatformBundledPolicyPackRegistryBootstrapper(
    IPlatformBundledPolicyPackRegistryRepository registryRepository,
    ILogger<PlatformBundledPolicyPackRegistryBootstrapper> logger)
{
    private readonly IPlatformBundledPolicyPackRegistryRepository _registryRepository =
        registryRepository ?? throw new ArgumentNullException(nameof(registryRepository));

    private readonly ILogger<PlatformBundledPolicyPackRegistryBootstrapper> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task EnsureRegistrySeededAsync(CancellationToken ct)
    {
        IReadOnlyList<(string ContentFile, string DisplayName)> seedEntries =
            DefaultPolicyPackBundledManifest.LoadRegistrySeedEntries();

        foreach ((string contentFile, string displayName) in seedEntries)
        {
            await _registryRepository.UpsertAsync(
                new PlatformBundledPolicyPackRegistryEntry
                {
                    BundleContentFile = contentFile,
                    DisplayName = displayName,
                    IsGloballyActive = true,
                    UpdatedUtc = TimeProvider.System.UtcNowDateTime(),
                },
                ct);
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Ensured platform bundled policy pack registry contains {Count} manifest rows.",
                seedEntries.Count);
        }
    }
}
