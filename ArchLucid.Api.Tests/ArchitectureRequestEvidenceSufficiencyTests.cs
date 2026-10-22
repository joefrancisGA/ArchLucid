using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using ArchLucid.Api.Validators;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestEvidenceSufficiencyTests
{
    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_Azure_always_true()
    {
        ArchitectureRequest request = new()
        {
            Description = "short",
            CloudProvider = CloudProvider.Azure,
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_long_description_true()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = new string('x', ArchitectureRequestEvidenceSufficiency.MinDescriptionLengthForNoneOnly),
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_short_description_false()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = "Too short for evidence-only intake.",
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeFalse();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_document_true()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = "Brief note.",
            Documents =
            [
                new ContextDocumentRequest
                {
                    Name = "adr-001",
                    ContentType = "text/markdown",
                    Content = "# ADR",
                },
            ],
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_infrastructure_declaration_true()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = "Brief",
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationRequest { Name = "vpc", Content = "{}" },
            ],
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_inline_requirement_true()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = "Brief",
            InlineRequirements = ["Must encrypt data at rest"],
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }

    [Fact]
    public void HasSufficientEvidenceForNoneProvider_when_None_and_topology_hint_true()
    {
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.None,
            Description = "Brief",
            TopologyHints = ["hub-spoke"],
        };

        ArchitectureRequestEvidenceSufficiency.HasSufficientEvidenceForNoneProvider(request).Should().BeTrue();
    }
}
