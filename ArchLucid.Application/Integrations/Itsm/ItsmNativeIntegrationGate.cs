using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Central gate for TB-387 native ITSM create (outbound one-click) vs manual integration seams.</summary>
public sealed class ItsmNativeIntegrationGate(IOptionsMonitor<IntegrationsItsmOptions> options)
{
    public const string NativeCreateDisabledMessage =
        "Native ITSM ticket creation is disabled in this environment. Use copy-as-work-item or register external tracking manually.";

    private readonly IOptionsMonitor<IntegrationsItsmOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public bool IsNativeCreateEnabled() => _options.CurrentValue.NativeEnabled;
}
