using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC26 package-coverage batch: lightly exercised contract DTOs that still carried uncovered property lines in
///     merged CI Cobertura when the per-package floor moved to 86%.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc26Tests
{
    [Fact]
    public void AgentOutputEvaluationSummary_round_trips_aggregate_fields()
    {
        DateTime evaluatedUtc = new(2026, 8, 8, 16, 0, 0, DateTimeKind.Utc);

        AgentOutputEvaluationSummary summary = new()
        {
            RunId = "run-42",
            EvaluatedAtUtc = evaluatedUtc,
            AdvisoryCurrent = new AgentOutputEvaluationPerspective
            {
                Authority = "advisoryCurrent",
                Scores =
                [
                    new AgentOutputEvaluationScore
                    {
                        TraceId = "trace-1",
                        StructuralCompletenessRatio = 0.9,
                        MissingKeys = ["summary"],
                        QualityWarning = true,
                    },
                ],
                TracesSkippedCount = 2,
                AverageStructuralCompletenessRatio = 0.9,
                AverageSemanticScore = 0.8,
                AggregateQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            },
        };

        summary.RunId.Should().Be("run-42");
        summary.EvaluatedAtUtc.Should().Be(evaluatedUtc);
        summary.AdvisoryCurrent.Scores.Should().ContainSingle();
        summary.AdvisoryCurrent.TracesSkippedCount.Should().Be(2);
        summary.AdvisoryCurrent.AverageStructuralCompletenessRatio.Should().Be(0.9);
        summary.AdvisoryCurrent.AverageSemanticScore.Should().Be(0.8);
        summary.AdvisoryCurrent.AggregateQualityGateOutcome.Should().Be(AgentOutputQualityGateOutcome.Accepted);
    }

    [Fact]
    public void SimulationEvaluationOptions_round_trips_live_determinism_settings()
    {
        SimulationEvaluationOptions options = new()
        {
            InvokeLiveDeterminismCheck = true,
            BaselineArchitectureRunIdForDeterminism = "run-baseline",
            DeterminismIterations = 5,
        };

        options.InvokeLiveDeterminismCheck.Should().BeTrue();
        options.BaselineArchitectureRunIdForDeterminism.Should().Be("run-baseline");
        options.DeterminismIterations.Should().Be(5);
    }

    [Fact]
    public void Product_learning_contract_responses_round_trip_header_fields()
    {
        DateTime generatedUtc = new(2026, 8, 8, 17, 0, 0, DateTimeKind.Utc);
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ProductLearningDashboardSummaryResponse dashboard = new()
        {
            GeneratedUtc = generatedUtc,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            TotalSignalsInScope = 12,
            DistinctRunsTouched = 4,
            TopAggregateCount = 3,
            ArtifactTrendCount = 2,
            ImprovementOpportunityCount = 1,
            TriageQueueItemCount = 5,
            SummaryNotes = ["Pilot cohort only"],
        };

        dashboard.TotalSignalsInScope.Should().Be(12);
        dashboard.SummaryNotes.Should().ContainSingle("Pilot cohort only");

        ProductLearningTriageQueueResponse triage = new()
        {
            GeneratedUtc = generatedUtc,
            Items = [],
        };

        triage.GeneratedUtc.Should().Be(generatedUtc);
        triage.Items.Should().BeEmpty();

        ProductLearningArtifactOutcomeTrendsResponse trends = new()
        {
            GeneratedUtc = generatedUtc,
            Trends = [],
        };

        trends.GeneratedUtc.Should().Be(generatedUtc);

        ProductLearningImprovementOpportunitiesResponse opportunities = new()
        {
            GeneratedUtc = generatedUtc,
            Opportunities = [],
        };

        opportunities.GeneratedUtc.Should().Be(generatedUtc);

        ProductLearningReportExportResponse export = new()
        {
            Format = "markdown",
            FileName = "triage-report.md",
            Content = "# Triage",
        };

        export.Format.Should().Be("markdown");
        export.FileName.Should().Be("triage-report.md");

        LearningPlanningReportExportResponse planningExport = new()
        {
            Format = "markdown",
            FileName = "planning-report.md",
            Content = "# Planning",
        };

        planningExport.Content.Should().Be("# Planning");

        LearningPlanningReportArtifactRef artifactRef = new()
        {
            LinkId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            AuthorityBundleId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            AuthorityArtifactSortOrder = 2,
            PilotArtifactHint = "architecture-narrative",
        };

        artifactRef.LinkId.Should().NotBe(Guid.Empty);
        artifactRef.PilotArtifactHint.Should().Be("architecture-narrative");
    }

    [Fact]
    public void Governance_and_pilot_signal_contracts_round_trip_properties()
    {
        GovernanceLineageRunSummary run = new()
        {
            RunId = "run-7",
            Status = "Completed",
            CreatedUtc = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 8, 1, 1, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v3",
        };

        run.RunId.Should().Be("run-7");
        run.CurrentManifestVersion.Should().Be("v3");

        GovernanceLineageFindingSummary finding = new()
        {
            FindingId = "finding-3",
            Title = "Open storage endpoint",
            Severity = "High",
            EngineType = "policy",
            TraceCompletenessRatio = 0.75,
            SourceAgentExecutionTraceId = "trace-9",
        };

        finding.TraceCompletenessRatio.Should().Be(0.75);
        finding.SourceAgentExecutionTraceId.Should().Be("trace-9");

        PreCommitGovernanceGateOptions gateOptions = new()
        {
            PreCommitGateEnabled = true,
            PreCommitGateThreshold = "High",
            WarnOnlySeverities = ["Warning"],
            ApprovalSlaHours = 24,
            ApprovalSlaEscalationWebhookUrl = "https://hooks.example/sla",
            EscalationWebhookSecret = "secret",
        };

        PreCommitGovernanceGateOptions.SectionPath.Should().Be("ArchLucid:Governance");
        gateOptions.PreCommitGateEnabled.Should().BeTrue();
        gateOptions.WarnOnlySeverities.Should().ContainSingle("Warning");

        ProductLearningPilotSignalRecord signal = new()
        {
            SignalId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            TenantId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            WorkspaceId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
            ProjectId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            ArchitectureRunId = "run-99",
            SubjectType = "finding",
            Disposition = "needs-review",
            RecordedUtc = new DateTime(2026, 8, 8, 18, 0, 0, DateTimeKind.Utc),
        };

        signal.ArchitectureRunId.Should().Be("run-99");
        signal.Disposition.Should().Be("needs-review");
    }
}
