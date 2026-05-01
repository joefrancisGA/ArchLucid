using ArchLucid.Api.Configuration;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

public sealed class ArchitectureRunCreationConfigurationBridgeTests
{
    [SkippableFact]
    public void Apply_copies_legacy_MaxPayloadBytes_when_modern_key_unset()
    {
        const string legacyKey = "ArchLucid:ContextIngestion:MaxPayloadBytes";
        ConfigurationManager configuration = new();

        configuration[legacyKey] = "2048";

        ArchitectureRunCreationConfigurationBridge.Apply(configuration);

        configuration[ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey].Should().Be("2048");
    }

    [SkippableFact]
    public void Apply_leaves_modern_MaxPayloadBytes_when_already_set()
    {
        const string legacyKey = "ArchLucid:ContextIngestion:MaxPayloadBytes";
        ConfigurationManager configuration = new();

        configuration[ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey] = "4096";
        configuration[legacyKey] = "2048";

        ArchitectureRunCreationConfigurationBridge.Apply(configuration);

        configuration[ArchitectureRunCreationPayloadLimitsOptions.MaxPayloadBytesKey].Should().Be("4096");
    }
}
