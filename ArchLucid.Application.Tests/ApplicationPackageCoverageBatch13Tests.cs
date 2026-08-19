using System.Text;

using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch13Tests
{
    private const string RunId = "run-batch13";
    private const string TaskId = "task-batch13";

    [Fact]
    public void FakeAgentResultFactory_CreateTopologyResult_populates_topology_proposal()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);

        AgentResult result = FakeAgentResultFactory.CreateTopologyResult(RunId, TaskId, request);

        result.RunId.Should().Be(RunId);
        result.TaskId.Should().Be(TaskId);
        result.AgentType.Should().Be(AgentType.Topology);
        result.Claims.Should().Contain(c => c.Contains(request.SystemName, StringComparison.Ordinal));
        result.ProposedChanges.Should().NotBeNull();
        result.ProposedChanges!.AddedServices.Should().HaveCount(3);
        result.ProposedChanges.AddedDatastores.Should().ContainSingle();
    }

    [Fact]
    public void FakeAgentResultFactory_CreateCostResult_populates_cost_findings()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);

        AgentResult result = FakeAgentResultFactory.CreateCostResult(RunId, TaskId, request);

        result.AgentType.Should().Be(AgentType.Cost);
        result.Confidence.Should().BeApproximately(0.79, 0.001);
        result.Findings.Should().ContainSingle(f => f.Category == "Cost");
    }

    [Fact]
    public void FakeAgentResultFactory_CreateComplianceResult_without_private_capability_uses_base_controls()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);

        AgentResult result = FakeAgentResultFactory.CreateComplianceResult(RunId, TaskId, request);

        result.AgentType.Should().Be(AgentType.Compliance);
        result.ProposedChanges.Should().NotBeNull();
        result.ProposedChanges!.RequiredControls.Should().BeEquivalentTo(["Managed Identity", "Key Vault", "Private Endpoints"]);
        result.ProposedChanges.RequiredControls.Should().NotContain("Private Networking");
    }

    [Fact]
    public void FakeAgentResultFactory_CreateComplianceResult_with_private_capability_adds_private_networking()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: true);

        AgentResult result = FakeAgentResultFactory.CreateComplianceResult(RunId, TaskId, request);

        result.ProposedChanges.Should().NotBeNull();
        result.ProposedChanges!.RequiredControls.Should().Contain("Private Networking");
        result.ProposedChanges.RequiredControls.Should().HaveCount(4);
    }

    [Fact]
    public void FakeAgentResultFactory_CreateCriticResult_references_system_name()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);

        AgentResult result = FakeAgentResultFactory.CreateCriticResult(RunId, TaskId, request);

        result.AgentType.Should().Be(AgentType.Critic);
        result.Claims.Should().Contain(c => c.Contains(request.SystemName, StringComparison.Ordinal));
    }

    [Fact]
    public void FakeAgentResultFactory_CreateStarterResults_returns_all_four_agent_types()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: true);
        IReadOnlyCollection<AgentTask> tasks = CreateFullTaskSet();

        IReadOnlyList<AgentResult> results = FakeAgentResultFactory.CreateStarterResults(RunId, tasks, request);

        results.Should().HaveCount(4);
        results.Select(r => r.AgentType).Should().BeEquivalentTo(
        [
            AgentType.Topology,
            AgentType.Cost,
            AgentType.Compliance,
            AgentType.Critic,
        ]);
        results.Should().OnlyContain(r => r.RunId == RunId);
    }

    [Theory]
    [InlineData(AgentType.Topology, "Topology task was not found.")]
    [InlineData(AgentType.Cost, "Cost task was not found.")]
    [InlineData(AgentType.Compliance, "Compliance task was not found.")]
    [InlineData(AgentType.Critic, "Critic task was not found.")]
    public void FakeAgentResultFactory_CreateStarterResults_throws_when_task_type_missing(
        AgentType missingType,
        string expectedMessage)
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);
        IReadOnlyCollection<AgentTask> tasks = CreateFullTaskSet(exclude: missingType);

        Action act = () => FakeAgentResultFactory.CreateStarterResults(RunId, tasks, request);

        act.Should().Throw<InvalidOperationException>().WithMessage(expectedMessage);
    }

    [Fact]
    public void FakeAgentResultFactory_null_arguments_throw()
    {
        ArchitectureRequest request = CreateRequest(includePrivateCapability: false);
        IReadOnlyCollection<AgentTask> tasks = CreateFullTaskSet();

        Action topologyNullRun = () => FakeAgentResultFactory.CreateTopologyResult(null!, TaskId, request);
        Action topologyNullTask = () => FakeAgentResultFactory.CreateTopologyResult(RunId, null!, request);
        Action topologyNullRequest = () => FakeAgentResultFactory.CreateTopologyResult(RunId, TaskId, null!);

        topologyNullRun.Should().Throw<ArgumentNullException>();
        topologyNullTask.Should().Throw<ArgumentNullException>();
        topologyNullRequest.Should().Throw<ArgumentNullException>();

        Action costNullRun = () => FakeAgentResultFactory.CreateCostResult(null!, TaskId, request);
        Action costNullTask = () => FakeAgentResultFactory.CreateCostResult(RunId, null!, request);
        Action costNullRequest = () => FakeAgentResultFactory.CreateCostResult(RunId, TaskId, null!);

        costNullRun.Should().Throw<ArgumentNullException>();
        costNullTask.Should().Throw<ArgumentNullException>();
        costNullRequest.Should().Throw<ArgumentNullException>();

        Action complianceNullRun = () => FakeAgentResultFactory.CreateComplianceResult(null!, TaskId, request);
        Action complianceNullTask = () => FakeAgentResultFactory.CreateComplianceResult(RunId, null!, request);
        Action complianceNullRequest = () => FakeAgentResultFactory.CreateComplianceResult(RunId, TaskId, null!);

        complianceNullRun.Should().Throw<ArgumentNullException>();
        complianceNullTask.Should().Throw<ArgumentNullException>();
        complianceNullRequest.Should().Throw<ArgumentNullException>();

        Action criticNullRun = () => FakeAgentResultFactory.CreateCriticResult(null!, TaskId, request);
        Action criticNullTask = () => FakeAgentResultFactory.CreateCriticResult(RunId, null!, request);
        Action criticNullRequest = () => FakeAgentResultFactory.CreateCriticResult(RunId, TaskId, null!);

        criticNullRun.Should().Throw<ArgumentNullException>();
        criticNullTask.Should().Throw<ArgumentNullException>();
        criticNullRequest.Should().Throw<ArgumentNullException>();

        Action starterNullRun = () => FakeAgentResultFactory.CreateStarterResults(null!, tasks, request);
        Action starterNullTasks = () => FakeAgentResultFactory.CreateStarterResults(RunId, null!, request);
        Action starterNullRequest = () => FakeAgentResultFactory.CreateStarterResults(RunId, tasks, null!);

        starterNullRun.Should().Throw<ArgumentNullException>();
        starterNullTasks.Should().Throw<ArgumentNullException>();
        starterNullRequest.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(StructuralExecutionMode.Real, "Live model path for agent steps")]
    [InlineData(StructuralExecutionMode.Simulator, "Not real-mode AI")]
    [InlineData(StructuralExecutionMode.Fallback, "Fallback recorded")]
    [InlineData(StructuralExecutionMode.Mixed, "Mixed")]
    public void SponsorExecutionModeMarkdownFormatter_FormatSponsorExecutionMode_describes_mode(
        StructuralExecutionMode mode,
        string expectedFragment)
    {
        ArchitectureRun run = CreateRun(mode, realModeFellBackToSimulator: false);

        string formatted = SponsorExecutionModeMarkdownFormatter.FormatSponsorExecutionMode(run);

        formatted.Should().Contain(expectedFragment);
    }

    [Fact]
    public void SponsorExecutionModeMarkdownFormatter_AppendMarkdownSection_without_fallback_omits_substitution_note()
    {
        StringBuilder sb = new();
        ArchitectureRun run = CreateRun(StructuralExecutionMode.Real, realModeFellBackToSimulator: false);

        SponsorExecutionModeMarkdownFormatter.AppendMarkdownSection(sb, run);

        string markdown = sb.ToString();
        markdown.Should().Contain("## Execution mode");
        markdown.Should().NotContain("Simulator substitution");
    }

    [Fact]
    public void SponsorExecutionModeMarkdownFormatter_AppendMarkdownSection_with_fallback_includes_substitution_note()
    {
        StringBuilder sb = new();
        ArchitectureRun run = CreateRun(StructuralExecutionMode.Fallback, realModeFellBackToSimulator: true);

        SponsorExecutionModeMarkdownFormatter.AppendMarkdownSection(sb, run);

        string markdown = sb.ToString();
        markdown.Should().Contain("Simulator substitution");
        markdown.Should().Contain("Do not describe outputs as unqualified live-model proof");
    }

    [Theory]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, PilotRoiEvidenceConfidence.Strong)]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedViaSettings, PilotRoiEvidenceConfidence.Strong)]
    [InlineData(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, PilotRoiEvidenceConfidence.Partial)]
    [InlineData(ReviewCycleBaselineProvenance.NoMeasurementYet, PilotRoiEvidenceConfidence.Low)]
    public void PilotRoiEvidenceConfidenceResolver_Resolve_maps_provenance_to_confidence(
        ReviewCycleBaselineProvenance provenance,
        PilotRoiEvidenceConfidence expectedConfidence)
    {
        ValueReportSnapshot snapshot = CreateSnapshot(provenance);

        PilotRoiEvidenceConfidence confidence = PilotRoiEvidenceConfidenceResolver.Resolve(snapshot);

        confidence.Should().Be(expectedConfidence);
    }

    [Fact]
    public void PilotRoiEvidenceConfidenceResolver_FormatBaselineProvenanceLabel_unknown_returns_fallback()
    {
        string label = PilotRoiEvidenceConfidenceResolver.FormatBaselineProvenanceLabel((ReviewCycleBaselineProvenance)99);

        label.Should().Be("Baseline posture unknown");
    }

    [Theory]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, "Tenant-supplied baseline captured at signup")]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedViaSettings, "Tenant-supplied baseline from pilot settings")]
    [InlineData(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, "Defaulted from ROI model options")]
    [InlineData(ReviewCycleBaselineProvenance.NoMeasurementYet, "No measurement yet")]
    public void PilotRoiEvidenceConfidenceResolver_FormatBaselineProvenanceLabel_returns_long_form_copy(
        ReviewCycleBaselineProvenance provenance,
        string expectedLabel)
    {
        string label = PilotRoiEvidenceConfidenceResolver.FormatBaselineProvenanceLabel(provenance);

        label.Should().Be(expectedLabel);
    }

    [Fact]
    public void PilotBuyerSafeEvidenceGateMarkdownFormatter_AppendMarkdownSection_with_no_gaps_lists_none_detected()
    {
        StringBuilder sb = new();
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            [],
            [],
            []);

        PilotBuyerSafeEvidenceGateMarkdownFormatter.AppendMarkdownSection(sb, gate);

        string markdown = sb.ToString();
        markdown.Should().Contain("## Sponsor send readiness (buyer-safe gate)");
        markdown.Should().Contain("**Gaps:** _None detected for the checks above");
        markdown.Should().NotContain("**Demo tenant blocking:**");
    }

    [Fact]
    public void PilotBuyerSafeEvidenceGateMarkdownFormatter_AppendMarkdownSection_with_gaps_lists_each_subsection()
    {
        StringBuilder sb = new();
        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Partial,
            ProofPackageSendability.SendableWithCaveats,
            ["demo gap"],
            ["hard gap"],
            ["soft gap"]);

        PilotBuyerSafeEvidenceGateMarkdownFormatter.AppendMarkdownSection(sb, gate);

        string markdown = sb.ToString();
        markdown.Should().Contain("**Demo tenant blocking:**");
        markdown.Should().Contain("1. demo gap");
        markdown.Should().Contain("**Structural blocking:**");
        markdown.Should().Contain("1. hard gap");
        markdown.Should().Contain("**Caveats:**");
        markdown.Should().Contain("1. soft gap");
    }

    [Fact]
    public void PilotRoiBaselineInputsMarkdownFormatter_AppendMarkdownSection_pass_when_all_buyer_provided()
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ProjectedDollarClaimsSponsorSafe = true,
        };

        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(sb, inputs);

        string markdown = sb.ToString();
        markdown.Should().Contain("**PASS** — all minimum baseline inputs are buyer-provided.");
        markdown.Should().Contain("Projected dollar claims sponsor-safe | **Yes**");
        markdown.Should().NotContain("SponsorSafeFallbackCopy");
    }

    [Theory]
    [InlineData(PilotRoiBaselineInputBasis.DemoDerived)]
    [InlineData(PilotRoiBaselineInputBasis.NotCollected)]
    public void PilotRoiBaselineInputsMarkdownFormatter_AppendMarkdownSection_hold_when_non_buyer_basis(
        PilotRoiBaselineInputBasis blockingBasis)
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ReviewCycleHoursBasis = blockingBasis,
            ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ProjectedDollarClaimsSponsorSafe = false,
            SponsorSafeFallbackCopy = "Do not lead sponsor readouts with projected dollar savings until baselines are collected.",
        };

        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(sb, inputs);

        string markdown = sb.ToString();
        markdown.Should().Contain("**HOLD** — projected dollar ROI claims are suppressed until buyer baselines are collected.");
        markdown.Should().Contain(inputs.SponsorSafeFallbackCopy);
    }

    [Fact]
    public void PilotRoiBaselineInputsMarkdownFormatter_AppendMarkdownSection_warn_when_defaulted_but_not_hold()
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsStatusResponse inputs = new()
        {
            ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.Defaulted,
            ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
            ProjectedDollarClaimsSponsorSafe = false,
            SponsorSafeFallbackCopy = "Label projected dollar ROI as estimates until all inputs are buyer-provided.",
        };

        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(sb, inputs);

        string markdown = sb.ToString();
        markdown.Should().Contain("**WARN** — projected dollar ROI claims require estimate labels until all inputs are buyer-provided.");
        markdown.Should().Contain(inputs.SponsorSafeFallbackCopy);
    }

    [Fact]
    public void SponsorRoiNarrativeGateMarkdownFormatter_AppendMarkdownSection_renders_disposition_block()
    {
        StringBuilder sb = new();
        SponsorRoiClaimDispositionResult gate = new(
            SponsorRoiClaimDisposition.Pass,
            PilotRoiEvidenceConfidence.Strong,
            "All minimum inputs buyer-provided",
            ProjectedDollarClaimsSponsorSafe: true,
            DispositionLeadLine: "**PASS** — sponsor-safe projected dollar claims.",
            NarrativeBlock: "Use buyer-provided baselines when narrating ROI.");

        SponsorRoiNarrativeGateMarkdownFormatter.AppendMarkdownSection(sb, gate);

        string markdown = sb.ToString();
        markdown.Should().Contain("## ROI narrative claim gate");
        markdown.Should().Contain("**PASS** — sponsor-safe projected dollar claims.");
        markdown.Should().Contain("**Evidence confidence:** **Strong**");
        markdown.Should().Contain("All minimum inputs buyer-provided");
        markdown.Should().Contain("Use buyer-provided baselines when narrating ROI.");
    }

    private static ArchitectureRequest CreateRequest(bool includePrivateCapability)
    {
        List<string> capabilities = includePrivateCapability
            ? ["private-networking", "managed-identity"]
            : ["managed-identity", "key-vault"];

        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            SystemName = "ClaimsIntakeApi",
            Description = "Design a resilient claims intake API for enterprise workloads.",
            Environment = "prod",
            RequiredCapabilities = capabilities,
        };
    }

    private static IReadOnlyCollection<AgentTask> CreateFullTaskSet(AgentType? exclude = null)
    {
        List<AgentTask> tasks =
        [
            CreateTask(AgentType.Topology, "topology-task"),
            CreateTask(AgentType.Cost, "cost-task"),
            CreateTask(AgentType.Compliance, "compliance-task"),
            CreateTask(AgentType.Critic, "critic-task"),
        ];

        if (exclude is null)
            return tasks;

        return tasks.Where(t => t.AgentType != exclude.Value).ToList();
    }

    private static AgentTask CreateTask(AgentType agentType, string taskId) =>
        new()
        {
            TaskId = taskId,
            RunId = RunId,
            AgentType = agentType,
        };

    private static ArchitectureRun CreateRun(StructuralExecutionMode mode, bool realModeFellBackToSimulator) =>
        new()
        {
            RunId = RunId,
            RequestId = "request-batch13",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = DateTime.UtcNow,
            StructuralExecutionMode = mode,
            RealModeFellBackToSimulator = realModeFellBackToSimulator,
        };

    private static ValueReportSnapshot CreateSnapshot(ReviewCycleBaselineProvenance provenance) =>
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            3,
            2,
            1,
            0,
            10m,
            2m,
            1m,
            13m,
            4.5m,
            "Per-run estimate from ValueReportComputationOptions — not invoice truth.",
            12000m,
            900m,
            25000m,
            -13900m,
            -55.6m,
            12m,
            "signup-form",
            DateTimeOffset.Parse("2026-03-01T00:00:00Z"),
            8m,
            2,
            provenance,
            null,
            null,
            0,
            0,
            4m,
            null);
}
