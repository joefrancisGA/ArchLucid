using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
public sealed class GraphMergeRuntimeInvariantReporterTests
{
    [Fact]
    public async Task Reporter_audits_when_merge_checker_finds_violations()
    {
        Mock<IAuditService> auditService = new();
        Mock<IHostEnvironment> hostEnvironment = new();
        hostEnvironment.Setup(static h => h.EnvironmentName).Returns("Development");

        GraphMergeRuntimeInvariantReporter reporter = new(
            auditService.Object,
            hostEnvironment.Object,
            Options.Create(new GraphMergeRuntimeInvariantOptions { Enabled = true }),
            NullLogger<GraphMergeRuntimeInvariantReporter>.Instance);

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "dangling",
                    FromNodeId = "missing-from",
                    ToNodeId = "missing-to",
                    EdgeType = "connects-to",
                }
            ],
            Warnings = [],
        };

        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        await reporter.ReportAfterMergeAsync(scope, graph);

        auditService.Verify(
            static s => s.LogAsync(
                It.Is<AuditEvent>(static e => e.EventType == AuditEventTypes.GraphMergeInvariantViolation),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
