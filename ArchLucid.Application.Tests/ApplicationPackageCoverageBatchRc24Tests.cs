using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.IntegrationOutbox;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests;

/// <summary>RC24 coverage uplift: DOCX supplemental sections, policy-pack before/after, citations, mappers.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatchRc24Tests
{
    [Fact]
    public void ConsultingDocxSupplementalSections_AddDocumentControl_and_TOC_render_run_metadata()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "run-rc24",
                RequestId = "req-rc24",
                Status = ArchitectureRunStatus.Created,
                CreatedUtc = DateTime.UtcNow,
                CurrentManifestVersion = "v1",
            },
        };

        ConsultingDocxSupplementalSections.AddDocumentControl(body, report);
        ConsultingDocxSupplementalSections.AddTableOfContentsPlaceholder(body);

        string text = body.InnerText;
        text.Should().Contain("Document Control");
        text.Should().Contain("run-rc24");
        text.Should().Contain("Table of Contents");
        text.Should().Contain("1. Sponsor report");
    }

    [Fact]
    public void ConsultingDocxSupplementalSections_AddSponsorReport_substitutes_template_and_warns()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Manifest = new GoldenManifest
            {
                SystemName = "Claims Intake",
                Services = [new ManifestService { ServiceName = "api" }],
                Datastores = [new ManifestDatastore { DatastoreName = "sql" }],
                Governance = new ManifestGovernance { RequiredControls = ["encrypt"] },
            },
            Warnings = ["Gap A"],
        };
        ConsultingDocxTemplateOptions options = new()
        {
            OrganizationName = "Contoso",
            SponsorReportTextTemplate =
                "{SystemName} for {OrganizationName}: {ServiceCount}/{DatastoreCount}/{ControlCount}",
        };

        ConsultingDocxSupplementalSections.AddSponsorReport(body, report, options);

        string text = body.InnerText;
        text.Should().Contain("Claims Intake for Contoso: 1/1/1");
        text.Should().Contain("Key warnings were identified");
    }

    [Fact]
    public async Task ConsultingDocxSupplementalSections_AddArchitectureOverviewAsync_handles_missing_manifest()
    {
        using MemoryStream stream = new();
        using WordprocessingDocument document = WordprocessingDocument.Create(
            stream, WordprocessingDocumentType.Document, true);
        MainDocumentPart mainPart = document.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        Body body = mainPart.Document.Body!;
        Mock<IDiagramImageRenderer> renderer = new();

        await ConsultingDocxSupplementalSections.AddArchitectureOverviewAsync(
            body,
            mainPart,
            new ArchitectureAnalysisReport { Manifest = null },
            new ConsultingDocxTemplateOptions(),
            renderer.Object,
            CancellationToken.None);

        body.InnerText.Should().Contain("No manifest was available for this run.");
        renderer.Verify(
            r => r.RenderMermaidPngAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void ConsultingDocxSupplementalSections_AddArchitectureDetails_and_Governance_render_manifest()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Manifest = new GoldenManifest
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceName = "Payments",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                        Purpose = "Take payments",
                        RequiredControls = ["mTLS"],
                    },
                ],
                Datastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreName = "Ledger",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                        PrivateEndpointRequired = true,
                        EncryptionAtRestRequired = true,
                    },
                ],
                Governance = new ManifestGovernance
                {
                    RiskClassification = "High",
                    CostClassification = "Medium",
                    RequiredControls = ["encrypt"],
                    ComplianceTags = ["PCI"],
                    PolicyConstraints = ["no-public-sql"],
                },
            },
        };

        ConsultingDocxSupplementalSections.AddArchitectureDetails(body, report);
        ConsultingDocxSupplementalSections.AddGovernanceAndControls(body, report);

        string text = body.InnerText;
        text.Should().Contain("Payments");
        text.Should().Contain("Ledger");
        text.Should().Contain("High");
        text.Should().Contain("PCI");
    }

    [Fact]
    public void ConsultingDocxOpenXmlPrimitives_AddStylesPart_and_paragraph_helpers_write_body()
    {
        using MemoryStream stream = new();
        using WordprocessingDocument document = WordprocessingDocument.Create(
            stream, WordprocessingDocumentType.Document, true);
        MainDocumentPart mainPart = document.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        Body body = mainPart.Document.Body!;
        ConsultingDocxTemplateOptions options = new();

        ConsultingDocxOpenXmlPrimitives.AddStylesPart(mainPart, options);
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Heading", 1);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "Body line", "BodyText");
        ConsultingDocxOpenXmlPrimitives.AddBullet(body, "Bullet");
        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
        ConsultingDocxOpenXmlPrimitives.AddKeyValueTable(body, [("Key", "Value")]);
        ConsultingDocxOpenXmlPrimitives.AddCallout(body, "Callout text", options);

        mainPart.StyleDefinitionsPart.Should().NotBeNull();
        body.InnerText.Should().Contain("Heading");
        body.InnerText.Should().Contain("Body line");
        body.InnerText.Should().Contain("Bullet");
        body.InnerText.Should().Contain("Key");
        body.InnerText.Should().Contain("Callout text");
    }

    [Fact]
    public void PolicyPackBeforeAfterDiffComposer_computes_added_removed_and_blocking_flips()
    {
        PolicyPackBeforeAfterConfigurationSnapshot before = new()
        {
            ConfigurationLabel = "before",
            PriorityFloor = "P1",
            ActiveComplianceRuleKeysOrdered = ["rule-a", "rule-b"],
            Findings =
            [
                new PolicyPackBeforeAfterFindingLine
                {
                    FindingId = "f-1",
                    Severity = "Critical",
                    Title = "Old block",
                    BlocksCommitUnderConfiguration = true,
                },
            ],
            GateBlocked = true,
            SponsorReportLines = ["line-old"],
        };
        PolicyPackBeforeAfterConfigurationSnapshot after = new()
        {
            ConfigurationLabel = "after",
            PriorityFloor = "P0",
            ActiveComplianceRuleKeysOrdered = ["rule-b", "rule-c"],
            Findings =
            [
                new PolicyPackBeforeAfterFindingLine
                {
                    FindingId = "f-2",
                    Severity = "Critical",
                    Title = "New block",
                    BlocksCommitUnderConfiguration = true,
                },
            ],
            GateBlocked = false,
            SponsorReportLines = ["line-new"],
        };

        PolicyPackBeforeAfterDiffChangeSet diff = PolicyPackBeforeAfterDiffComposer.Compose(before, after);

        diff.AddedComplianceRuleKeys.Should().ContainSingle().Which.Should().Be("rule-c");
        diff.RemovedComplianceRuleKeys.Should().ContainSingle().Which.Should().Be("rule-a");
        diff.FindingsNewlyBlockingCommit.Should().ContainSingle().Which.Should().Be("f-2");
        diff.FindingsNoLongerBlockingCommit.Should().ContainSingle().Which.Should().Be("f-1");
        diff.SponsorReportLinesAdded.Should().Contain("line-new");
        diff.SponsorReportLinesRemoved.Should().Contain("line-old");
        diff.GateBlockedFlipped.Should().BeTrue();
    }

    [Fact]
    public void PolicyPackBeforeAfterConfigurationSnapshotBuilder_builds_executive_lines_for_blocked_gate()
    {
        PolicyPackBeforeAfterConfiguration configuration = new()
        {
            Label = "strict",
            Content = new PolicyPackContentDocument
            {
                ComplianceRuleKeys = ["rule-1"],
            },
            BlockCommitOnCritical = true,
        };
        ComplianceRulePack pack = new()
        {
            RulePackId = "pack-1",
            Name = "Pack",
            Version = "1",
            RulePackHash = "hash",
            SourcePath = "pack.json",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "rule-1",
                    ControlId = "c1",
                    ControlName = "Control",
                    AppliesToCategory = "network",
                    RequiredNodeType = "Service",
                    RequiredEdgeType = "DependsOn",
                    Description = "Must encrypt",
                    Priority = "P0",
                },
            ],
        };
        Finding finding = new()
        {
            FindingId = "find-1",
            FindingType = "Compliance",
            Category = "Security",
            EngineType = "Policy",
            Severity = FindingSeverity.Critical,
            Title = "Missing encryption",
        };

        PolicyPackBeforeAfterConfigurationSnapshot snapshot =
            PolicyPackBeforeAfterConfigurationSnapshotBuilder.Build(
                configuration,
                pack,
                [finding],
                new PreCommitGateResult { Blocked = true, Reason = "critical", BlockingFindingIds = ["find-1"] });

        snapshot.ConfigurationLabel.Should().Be("strict");
        snapshot.GateBlocked.Should().BeTrue();
        snapshot.ActiveComplianceRuleKeysOrdered.Should().Contain("rule-1");
        snapshot.Findings.Should().ContainSingle(f => f.FindingId == "find-1" && f.BlocksCommitUnderConfiguration);
        snapshot.SponsorReportLines.Should().Contain(l => l.Contains("blocked", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData(CloudProvider.Aws, "Aws")]
    [InlineData(CloudProvider.Gcp, "Gcp")]
    [InlineData(CloudProvider.Azure, "Cloud")]
    public void CloudInventoryExtractorCitationFormatter_prefixes_by_provider(
        CloudProvider provider,
        string expectedPrefix)
    {
        CloudInventoryExtractorNormalizedManifest manifest = new(
            SchemaVersion: 2,
            ScriptVersion: "1.0",
            CollectionTimestamp: DateTimeOffset.Parse("2026-08-05T12:00:00Z"),
            CloudProvider: provider,
            ScopeId: "scope-1",
            Scope: "subscription",
            SwitchesUsed: ["--all"],
            CollectorVersion: "rc24",
            RawJson: "{}");

        string citation = CloudInventoryExtractorCitationFormatter.FormatCostProofPoint(manifest);

        citation.Should().StartWith(expectedPrefix);
        citation.Should().Contain("schemaVersion=2");
        citation.Should().Contain("scopeId=scope-1");
    }

    [Theory]
    [InlineData(null, FindingHumanReviewStatus.NotRequired)]
    [InlineData("pending", FindingHumanReviewStatus.Pending)]
    [InlineData("not-a-status", FindingHumanReviewStatus.NotRequired)]
    public void RunFindingExternalTrackingFieldMapper_ParseHumanReview_defaults_safely(
        string? raw,
        FindingHumanReviewStatus expected)
    {
        RunFindingExternalTrackingFieldMapper.ParseHumanReview(raw).Should().Be(expected);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("accepted", FindingDisposition.Accepted)]
    [InlineData("bogus", null)]
    public void RunFindingExternalTrackingFieldMapper_ParseDisposition_handles_blank_and_invalid(
        string? raw,
        FindingDisposition? expected)
    {
        RunFindingExternalTrackingFieldMapper.ParseDisposition(raw).Should().Be(expected);
    }

    [Fact]
    public void RunFindingExternalTrackingFieldMapper_ToUtcOffset_specifies_utc_kind()
    {
        DateTime localish = new(2026, 8, 5, 10, 0, 0, DateTimeKind.Unspecified);

        DateTimeOffset? offset = RunFindingExternalTrackingFieldMapper.ToUtcOffset(localish);

        offset.Should().NotBeNull();
        offset!.Value.Offset.Should().Be(TimeSpan.Zero);
        RunFindingExternalTrackingFieldMapper.ToUtcOffset(null).Should().BeNull();
    }

    [Fact]
    public void SponsorEvidenceExplainabilityMapper_maps_engine_rows()
    {
        TraceCompletenessSummary summary = new()
        {
            TotalFindings = 2,
            OverallCompletenessRatio = 0.5,
            ByEngine =
            [
                new EngineTraceCompleteness
                {
                    EngineType = "Topology",
                    FindingCount = 2,
                    CompletenessRatio = 0.5,
                    GraphNodeIdsPopulatedCount = 1,
                    RulesAppliedPopulatedCount = 1,
                    DecisionsTakenPopulatedCount = 0,
                    AlternativePathsPopulatedCount = 0,
                    NotesPopulatedCount = 0,
                },
            ],
        };

        ExplainabilityTraceCompletenessPack pack = SponsorEvidenceExplainabilityMapper.ToContract(summary);

        pack.TotalFindings.Should().Be(2);
        pack.ByEngine.Should().ContainSingle(e => e.EngineType == "Topology" && e.FindingCount == 2);
    }

    [Fact]
    public async Task TrialLifecycleIntegrationEventPublisher_TryPublishAsync_enqueues_when_outbox_enabled()
    {
        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IIntegrationEventPublisher> publisher = new();
        IntegrationEventsOptions options = new() { TransactionalOutboxEnabled = true };
        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            Trigger = TrialLifecycleEmailTrigger.Converted,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            TargetTier = "Professional",
        };

        await TrialLifecycleIntegrationEventPublisher.TryPublishAsync(
            outbox.Object,
            publisher.Object,
            options,
            NullLogger.Instance,
            envelope,
            messageId: "msg-rc24",
            CancellationToken.None);

        outbox.Verify(
            o => o.EnqueueAsync(
                It.IsAny<Guid?>(),
                IntegrationEventTypes.TrialLifecycleEmailV1,
                "msg-rc24",
                It.IsAny<ReadOnlyMemory<byte>>(),
                envelope.TenantId,
                envelope.WorkspaceId,
                envelope.ProjectId,
                It.IsAny<CancellationToken>()),
            Times.Once);
        publisher.Verify(
            p => p.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void TrialLifecycleEmailIntegrationEnvelope_round_trips_json()
    {
        TrialLifecycleEmailIntegrationEnvelope envelope = new()
        {
            Trigger = TrialLifecycleEmailTrigger.ExpiringSoon,
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        byte[] utf8 = JsonSerializer.SerializeToUtf8Bytes(envelope, IntegrationEventJson.Options);
        TrialLifecycleEmailIntegrationEnvelope? parsed =
            JsonSerializer.Deserialize<TrialLifecycleEmailIntegrationEnvelope>(utf8, IntegrationEventJson.Options);

        parsed.Should().NotBeNull();
        parsed!.Trigger.Should().Be(TrialLifecycleEmailTrigger.ExpiringSoon);
        parsed.TenantId.Should().Be(envelope.TenantId);
    }
}
