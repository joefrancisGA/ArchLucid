using ArchLucid.Application.Evidence;
using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Application.Tests.Evidence;

public sealed class BulkEvidenceUploadValidatorTests
{
    private readonly BulkEvidenceUploadValidator _validator = new();

    [Fact]
    public void ValidateBulkUpload_WithFileCountBelowMax_ReturnsSuccess()
    {
        // Act
        BulkEvidenceUploadValidationResult result = _validator.ValidateBulkUpload(fileCount: 30, maxAllowed: 30);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ErrorCode.Should().BeNull();
        result.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public void ValidateBulkUpload_WithFileCountAboveMax_ReturnsLimitExceededFailure()
    {
        // Act
        BulkEvidenceUploadValidationResult result = _validator.ValidateBulkUpload(fileCount: 31, maxAllowed: 30);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorCode.Should().Be(ProblemErrorCodes.EvidenceBulkUploadLimitExceeded);
        result.ErrorMessage.Should().Be("Upload exceeds the maximum allowed file count of 30.");
    }

    [Fact]
    public void ValidateBulkUpload_WithZeroFiles_ReturnsValidationFailed()
    {
        // Act
        BulkEvidenceUploadValidationResult result = _validator.ValidateBulkUpload(fileCount: 0, maxAllowed: 30);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorCode.Should().Be(ProblemErrorCodes.ValidationFailed);
        result.ErrorMessage.Should().Be("At least 1 file is required.");
    }
}
