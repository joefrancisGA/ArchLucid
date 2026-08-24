using ArchLucid.ContextIngestion.Mapping;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class ContextIngestionStableReferenceIdsTests
{
    [Theory]
    [InlineData("text/plain", "TEXT/PLAIN")]
    [InlineData("text/markdown", "Text/Markdown")]
    public void ForDocument_ignores_content_type_casing(string lowerContentType, string upperContentType)
    {
        ContextIngestionStableReferenceIds.ForDocument("spec.txt", lowerContentType)
            .Should()
            .Be(ContextIngestionStableReferenceIds.ForDocument("spec.txt", upperContentType));
    }

    [Theory]
    [InlineData("json", "JSON")]
    [InlineData("terraform-show-json", "Terraform-Show-Json")]
    public void ForInfrastructureDeclaration_ignores_format_casing(string lowerFormat, string upperFormat)
    {
        ContextIngestionStableReferenceIds.ForInfrastructureDeclaration("env.json", lowerFormat)
            .Should()
            .Be(ContextIngestionStableReferenceIds.ForInfrastructureDeclaration("env.json", upperFormat));
    }

    [Theory]
    [InlineData("spec.txt", "SPEC.TXT")]
    [InlineData("Env.json", "env.JSON")]
    public void ForDocument_ignores_name_casing(string lowerName, string upperName)
    {
        ContextIngestionStableReferenceIds.ForDocument(lowerName, "text/plain")
            .Should()
            .Be(ContextIngestionStableReferenceIds.ForDocument(upperName, "text/plain"));
    }
}
