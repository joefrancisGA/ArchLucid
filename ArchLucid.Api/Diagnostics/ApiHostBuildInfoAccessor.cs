using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Api.Diagnostics;

/// <inheritdoc cref="IHostBuildInfoAccessor" />
public sealed class ApiHostBuildInfoAccessor(
    IHostEnvironment environment,
    IConfiguration configuration,
    TimeProvider timeProvider) : IHostBuildInfoAccessor
{
    private readonly IHostEnvironment _environment =
        environment ?? throw new ArgumentNullException(nameof(environment));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public BuildInfoResponse GetBuildInfo() =>
        ApiBuildInfoFactory.Create(_environment, _configuration, _timeProvider);
}
