using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

internal static class HostedAzureExtractorGraphTestSupport
{
    public static (
        Mock<IEntraAddCredentialGraphReader> Reader,
        Mock<IOptionsMonitor<EntraAddCredentialGraphOptions>> Options) CreateAddCredentialGraphMocks(bool enabled = false)
    {
        Mock<IEntraAddCredentialGraphReader> reader = new();
        reader
            .Setup(graphReader => graphReader.TryReadSnapshotAsync(
                It.IsAny<TokenCredential>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(EntraAddCredentialGraphReadResult.Empty());

        Mock<IOptionsMonitor<EntraAddCredentialGraphOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new EntraAddCredentialGraphOptions { Enabled = enabled });

        return (reader, options);
    }
}
