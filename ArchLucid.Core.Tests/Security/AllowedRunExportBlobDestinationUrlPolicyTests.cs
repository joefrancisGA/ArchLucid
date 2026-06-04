using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class AllowedRunExportBlobDestinationUrlPolicyTests
{
    [Theory]
    [InlineData("https://acct.blob.core.windows.net/container/run.zip?sas=token")]
    [InlineData("https://acct.z13.blob.storage.azure.net/container/run.zip?sas=token")]
    public void TryGetRejectionReason_WhenAzureBlobHttps_Allows(string url)
    {
        AllowedRunExportBlobDestinationUrlPolicy.TryGetRejectionReason(url).Should().BeNull();
    }

    [Theory]
    [InlineData("http://acct.blob.core.windows.net/c?sas=1", "https scheme")]
    [InlineData("https://127.0.0.1/c?sas=1", "private")]
    [InlineData("https://example.com/c?sas=1", "Azure Blob")]
    [InlineData("https://acct.file.core.windows.net/share?sas=1", "Azure Blob")]
    public void TryGetRejectionReason_WhenUnsafeTarget_Rejects(string url, string expectedPhrase)
    {
        string? reason = AllowedRunExportBlobDestinationUrlPolicy.TryGetRejectionReason(url);

        reason.Should().NotBeNull();
        reason.Should().Contain(expectedPhrase);
    }
}
