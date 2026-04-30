using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Configuration;

public sealed class ArchLucidStorageMode(IOptions<ArchLucidOptions> options) : IArchLucidStorageMode
{
    private readonly IOptions<ArchLucidOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public bool IsInMemory => ArchLucidOptions.EffectiveIsInMemory(_options.Value.StorageProvider);
}
