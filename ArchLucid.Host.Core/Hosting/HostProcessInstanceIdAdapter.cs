namespace ArchLucid.Host.Core.Hosting;

using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosted;

/// <summary>Adapts <see cref="HostInstanceIdentifier" /> for application-layer lease services.</summary>
public sealed class HostProcessInstanceIdAdapter(HostInstanceIdentifier hostInstanceIdentifier) : IHostProcessInstanceId
{
    private readonly HostInstanceIdentifier _hostInstanceIdentifier =
        hostInstanceIdentifier ?? throw new ArgumentNullException(nameof(hostInstanceIdentifier));

    /// <inheritdoc />
    public string Value => _hostInstanceIdentifier.Value;
}
