using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using Moq;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Document Connector.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DocumentConnectorTests
{
    [Fact]
    public async Task NormalizeAsync_AddsWarning_WhenNoParserMatches()
    {
        Mock<IContextDocumentParser> mockParser = new();
        mockParser.Setup(p => p.CanParse(It.IsAny<string>())).Returns(false);

        DocumentConnector sut = new(
            new DocumentConnectorPayloadExtractor(),
            new DocumentConnectorPayloadNormalizer([mockParser.Object]),
            new Moq.Mock<ArchLucid.ContextIngestion.Delta.IConnectorDeltaComputer>().Object);
        RawContextPayload payload = new()
        {
            Documents =
            [
                new ContextDocumentReference
                {
                    Name = "unknown.bin", ContentType = "application/octet-stream", Content = "x"
                }
            ]
        };

        NormalizedContextBatch batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().BeEmpty();
        batch.Warnings.Should().ContainSingle();
        string warning = batch.Warnings[0];
        warning.Should().Contain("unknown.bin", "warning must name the skipped document");
        warning.Should().Contain("application/octet-stream", "warning must include the content type");
        warning.Should().Contain("ContextDocumentParserPipeline");
        warning.Should().Contain("SupportedContextDocumentContentTypes");
    }

    [Fact]
    public async Task NormalizeAsync_UsesFirstParserInPipelineOrder_WhenMultipleCanParse()
    {
        Mock<IContextDocumentParser> first = new();
        Mock<IContextDocumentParser> second = new();

        first.Setup(p => p.CanParse(It.IsAny<string>())).Returns(true);
        second.Setup(p => p.CanParse(It.IsAny<string>())).Returns(true);

        first.Setup(p => p.ParseAsync(It.IsAny<ContextDocumentReference>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new CanonicalObject { ObjectType = "Requirement", Name = "from-first", SourceType = "Document" }
            ]);

        second.Setup(p => p.ParseAsync(It.IsAny<ContextDocumentReference>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new CanonicalObject { ObjectType = "Requirement", Name = "from-second", SourceType = "Document" }
            ]);

        DocumentConnector sut = new(
            new DocumentConnectorPayloadExtractor(),
            new DocumentConnectorPayloadNormalizer([first.Object, second.Object]),
            new Moq.Mock<ArchLucid.ContextIngestion.Delta.IConnectorDeltaComputer>().Object);
        RawContextPayload payload = new()
        {
            Documents =
            [
                new ContextDocumentReference { Name = "doc.txt", ContentType = "text/plain", Content = "REQ: x" }
            ]
        };

        NormalizedContextBatch batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle().Which.Name.Should().Be("from-first");
        second.Verify(
            p => p.ParseAsync(It.IsAny<ContextDocumentReference>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeltaAsync_ReMappedDocumentWithDifferentContentTypeCasing_ReportsUnchanged()
    {
        ArchitectureRequest request = new()
        {
            Description = "1234567890 minimum len",
            SystemName = "billing-api",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Documents =
            [
                new ContextDocumentRequest
                {
                    Name = "spec.txt",
                    ContentType = "text/plain",
                    Content = "REQ: Must scale",
                }
            ],
        };

        DocumentConnector connector = new(
            new DocumentConnectorPayloadExtractor(),
            new DocumentConnectorPayloadNormalizer([new PlainTextContextDocumentParser()]),
            new SetDiffConnectorDeltaComputer());

        ContextIngestionRequest firstMapped = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        RawContextPayload firstRaw = await connector.FetchAsync(firstMapped, CancellationToken.None);
        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = firstMapped.ProjectId,
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        request.Documents[0].ContentType = "TEXT/PLAIN";
        ContextIngestionRequest secondMapped = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        RawContextPayload secondRaw = await connector.FetchAsync(secondMapped, CancellationToken.None);
        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(1);
    }
}
