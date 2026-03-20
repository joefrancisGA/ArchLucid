using ArchiForge.ContextIngestion.Connectors;
using ArchiForge.ContextIngestion.Infrastructure;
using ArchiForge.ContextIngestion.Models;
using FluentAssertions;
using Moq;

namespace ArchiForge.ContextIngestion.Tests;

public sealed class InfrastructureDeclarationConnectorTests
{
    [Fact]
    public async Task NormalizeAsync_Warns_WhenFormatUnsupported()
    {
        var sut = new InfrastructureDeclarationConnector([]);
        var payload = new RawContextPayload
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "bad.fmt",
                    Format = "hcl",
                    Content = "resource \"x\" \"y\" {}"
                }
            ]
        };

        var batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().BeEmpty();
        batch.Warnings.Should().ContainSingle().Which.Should().Contain("bad.fmt").And.Contain("hcl");
    }

    [Fact]
    public async Task NormalizeAsync_DelegatesToParser()
    {
        var parser = new Mock<IInfrastructureDeclarationParser>();
        parser.Setup(p => p.CanParse("json")).Returns(true);
        parser.Setup(p => p.ParseAsync(It.IsAny<InfrastructureDeclarationReference>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CanonicalObject>
            {
                new()
                {
                    ObjectType = "TopologyResource",
                    Name = "a",
                    SourceType = "InfrastructureDeclaration",
                    SourceId = "d",
                    Properties = new Dictionary<string, string> { ["resourceType"] = "vnet" }
                }
            });

        var sut = new InfrastructureDeclarationConnector([parser.Object]);
        var payload = new RawContextPayload
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference { Name = "x", Format = "json", Content = "{}" }
            ]
        };

        var batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().HaveCount(1);
        parser.Verify(p => p.ParseAsync(It.IsAny<InfrastructureDeclarationReference>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
