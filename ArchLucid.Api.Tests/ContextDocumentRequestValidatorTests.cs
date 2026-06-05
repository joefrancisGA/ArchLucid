using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <see cref="ContextDocumentRequestValidator" /> (inline architecture request documents).
/// </summary>
[Trait("Category", "Unit")]
public sealed class ContextDocumentRequestValidatorTests
{
    private readonly ContextDocumentRequestValidator _validator = new();

    private static ContextDocumentRequest ValidDocument()
    {
        return new ContextDocumentRequest { Name = "notes.md", ContentType = "text/markdown", Content = "REQ: sample" };
    }

    [SkippableFact]
    public async Task Validate_Succeeds_WhenAllRulesSatisfied()
    {
        ValidationResult result = await _validator.ValidateAsync(ValidDocument());

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public async Task Validate_Fails_WhenNameIsMissingOrWhitespace(string? name)
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.Name = name!;

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ContextDocumentRequest.Name));
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Name", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Validate_Fails_WhenNameExceedsMaxLength()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.Name = new string('a', 501);

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(ContextDocumentRequest.Name) &&
            e.ErrorMessage.Contains("500", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Validate_Fails_WhenContentTypeIsMissingOrWhitespace(string? contentType)
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.ContentType = contentType!;

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ContextDocumentRequest.ContentType));
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("ContentType", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Validate_Fails_WhenContentTypeIsUnsupported()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.ContentType = "application/pdf";

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(ContextDocumentRequest.ContentType)
            && e.ErrorMessage.Contains("text/plain", StringComparison.Ordinal)
            && e.ErrorMessage.Contains("text/markdown", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Validate_Fails_WhenContentTypeExceedsMaxLength()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.ContentType = new string('a', 256);

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(ContextDocumentRequest.ContentType) &&
            e.ErrorMessage.Contains("255", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Validate_Fails_WhenContentIsNull()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.Content = null!;

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ContextDocumentRequest.Content));
    }

    [SkippableFact]
    public async Task Validate_Fails_WhenContentExceedsMaxLength()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.Content = new string('x', 500_001);

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e =>
            e.PropertyName == nameof(ContextDocumentRequest.Content) &&
            e.ErrorMessage.Contains("500000", StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task Validate_Succeeds_WhenContentIsEmptyString()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.Content = string.Empty;

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Validate_Succeeds_When_SourceDocumentUrl_IsNullOrWhitespace()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.SourceDocumentUrl = null;

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Validate_Succeeds_When_SourceDocumentUrl_IsPublicHttps()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.SourceDocumentUrl = "https://example.com/docs/adr-1.md";

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeTrue();
    }

    [SkippableFact]
    public async Task Validate_Fails_When_SourceDocumentUrl_IsHttp()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.SourceDocumentUrl = "http://example.com/x";

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ContextDocumentRequest.SourceDocumentUrl));
    }

    [SkippableFact]
    public async Task Validate_Fails_When_SourceDocumentUrl_TargetsLoopbackHttps()
    {
        ContextDocumentRequest doc = ValidDocument();
        doc.SourceDocumentUrl = "https://127.0.0.1/secret";

        ValidationResult result = await _validator.ValidateAsync(doc);

        result.IsValid.Should().BeFalse();
    }
}
