using ArchLucid.Core.Configuration;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class EvidenceBulkUploadOptionsTests
{
    [Fact]
    public void EvidenceBulkUploadOptions_DefaultsToTwoHundredFiles()
    {
        // Arrange
        EvidenceBulkUploadOptions options = new();

        // Assert
        options.EvidenceBulkUploadMaxFiles.Should().Be(200);
    }

    [Fact]
    public void FormValueCountLimit_exceeds_default_max_files()
    {
        EvidenceBulkUploadOptions options = new();

        EvidenceBulkUploadOptions.FormValueCountLimit.Should().BeGreaterThan(options.EvidenceBulkUploadMaxFiles + 1);
    }
}
