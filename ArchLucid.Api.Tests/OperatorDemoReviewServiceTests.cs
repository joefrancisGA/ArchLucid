using ArchLucid.Api.Demo;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class OperatorDemoReviewServiceTests
{
    private static ScopeContext DemoScopePinned => DemoScopes.BuildDemoScope();

    [Fact]
    public async Task RunAsync_seeds_policy_packs_runs_pipeline_and_returns_policy_pack_name()
    {
        string runHex = Guid.NewGuid().ToString("N");
        ArchitectureRequest? capturedRequest = null;
        List<AuditEvent> auditTrail = [];

        Mock<IDefaultPolicyPackSeeder> seeder = new(MockBehavior.Strict);
        seeder
            .Setup(s => s.EnsureDefaultPolicyPacksAsync(
                DemoScopePinned.TenantId,
                DemoScopePinned.WorkspaceId,
                DemoScopePinned.ProjectId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ExecuteRunResult executed = ExecuteWithFindings(
            runHex,
            [
                CreateArchitectureFinding("Public blob access", FindingSeverity.Critical, policyRuleId: "sec-base-001"),
                CreateArchitectureFinding("Missing WAF", FindingSeverity.Error),
                CreateArchitectureFinding("SQL public endpoint", FindingSeverity.Warning),
            ]);

        GoldenManifest golden = MinimalCommitted(runHex, "demo-v1");

        Mock<IArchitectureRunCreateOrchestrator> create = new(MockBehavior.Strict);
        create
            .Setup(cr => cr.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .Callback<ArchitectureRequest, CreateRunIdempotencyState?, CancellationToken>((rq, _, _) =>
                capturedRequest = rq)
            .ReturnsAsync(NewCreateResult(runHex));

        Mock<IArchitectureRunExecuteOrchestrator> execute = new(MockBehavior.Strict);
        execute
            .Setup(e => e.ExecuteRunAsync(runHex, It.IsAny<CancellationToken>()))
            .ReturnsAsync(executed);

        Mock<IArchitectureRunCommitOrchestrator> commit = new(MockBehavior.Strict);
        commit
            .Setup(c => c.CommitRunAsync(runHex, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunResult { Manifest = golden });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Callback<AuditEvent, CancellationToken>((evt, _) => auditTrail.Add(evt));

        Mock<IActorContext> actor = new();
        actor.Setup(static a => a.GetActor()).Returns("operator-demo-unit");

        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(static s => s.GetCurrentScope()).Returns(DemoScopePinned);

        OperatorDemoReviewService sut = new(
            create.Object,
            execute.Object,
            commit.Object,
            seeder.Object,
            audit.Object,
            actor.Object,
            scopes.Object,
            NullLogger<OperatorDemoReviewService>.Instance);

        OperatorDemoReviewResponse body = await sut.RunAsync(CancellationToken.None);

        Assert.NotNull(capturedRequest);
        Assert.Equal(OperatorDemoReviewPresets.SystemDisplayName, capturedRequest!.SystemName);
        Assert.Contains("anonymous blob read", capturedRequest.Description, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(runHex, body.RunId);
        Assert.Equal("demo-v1", body.ManifestId);
        Assert.Equal(DefaultPolicyPackCatalog.SecurityBaselineDisplayName, body.PolicyPackName);
        Assert.Equal(3, body.TopFindings.Count);
        Assert.Equal("sec-base-001", body.TopFindings[0].PolicyRuleKey);
        Assert.Equal($"/reviews/{Uri.EscapeDataString(runHex)}", body.RunDetailUrl);

        seeder.Verify(
            s => s.EnsureDefaultPolicyPacksAsync(
                DemoScopePinned.TenantId,
                DemoScopePinned.WorkspaceId,
                DemoScopePinned.ProjectId,
                It.IsAny<CancellationToken>()),
            Times.Once);

        AuditEvent completed = auditTrail.Single(static e => e.EventType == AuditEventTypes.RunCompleted);
        Assert.Contains("operator-demo-review", completed.DataJson, StringComparison.Ordinal);
    }

    private static CreateRunResult NewCreateResult(string runId)
    {
        return new CreateRunResult
        {
            Run = new ArchitectureRun { RunId = runId },
        };
    }

    private static ExecuteRunResult ExecuteWithFindings(string runId, IReadOnlyList<ArchitectureFinding> findings)
    {
        return new ExecuteRunResult
        {
            RunId = runId,
            Results =
            [
                new AgentResult
                {
                    AgentType = AgentType.Topology,
                    Findings = findings.ToList()
                }
            ]
        };
    }

    private static GoldenManifest MinimalCommitted(string runId, string manifestVersion)
    {
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = "unit",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = manifestVersion },
        };
    }

    private static ArchitectureFinding CreateArchitectureFinding(
        string message,
        FindingSeverity severity,
        string category = "",
        string? policyRuleId = null)
    {
        return new ArchitectureFinding
        {
            Message = message,
            Severity = severity,
            Category = category,
            PolicyRuleId = policyRuleId,
        };
    }
}
