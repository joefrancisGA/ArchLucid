using System.Net;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Cosmos;

using Microsoft.Azure.Cosmos;

using Moq;

namespace ArchLucid.Persistence.Tests.Cosmos;

public sealed class CosmosAgentExecutionTracePatchTests
{
    [Fact]
    public async Task PatchDocumentAsync_RetainsAnIndependentPatchAfterAWriteConflict()
    {
        const string traceId = "trace";
        PartitionKey partitionKey = new("run");
        CancellationToken ct = CancellationToken.None;
        Mock<Container> container = new(MockBehavior.Strict);
        container.SetupSequence(c => c.ReadItemAsync<AgentTraceDocument>(traceId, partitionKey, null, ct))
            .ReturnsAsync(Snapshot("original", false))
            .ReturnsAsync(Snapshot("competing-write", true));
        container.Setup(c => c.ReplaceItemAsync(
                It.Is<AgentTraceDocument>(doc => doc.QualityWarning && !doc.QualityRejected),
                traceId, partitionKey, It.Is<ItemRequestOptions>(opts => opts.IfMatchEtag == "original"), ct))
            .ThrowsAsync(new CosmosException("Trace changed", HttpStatusCode.PreconditionFailed, 0, "activity", 0));
        container.Setup(c => c.ReplaceItemAsync(
                It.Is<AgentTraceDocument>(doc => doc.QualityWarning && doc.QualityRejected),
                traceId, partitionKey, It.Is<ItemRequestOptions>(opts => opts.IfMatchEtag == "competing-write"), ct))
            .ReturnsAsync(Mock.Of<ItemResponse<AgentTraceDocument>>())
            .Verifiable();

        await CosmosAgentExecutionTraceRepository.PatchDocumentAsync(
            container.Object, traceId, partitionKey, null, trace =>
            {
                trace.QualityWarning = true;
                return true;
            }, ct);

        container.Verify();

        static ItemResponse<AgentTraceDocument> Snapshot(string etag, bool qualityRejected)
        {
            AgentExecutionTrace trace = new()
            {
                TraceId = "trace",
                RunId = "run",
                TaskId = "task",
                QualityRejected = qualityRejected,
            };
            AgentTraceDocument document = CosmosAgentTraceDocumentMapper.BuildDocument(
                trace, JsonSerializer.Serialize(trace, ContractJson.Default), null);
            Mock<ItemResponse<AgentTraceDocument>> response = new();
            response.SetupGet(r => r.ETag).Returns(etag);
            response.SetupGet(r => r.Resource).Returns(document);
            return response.Object;
        }
    }

}
