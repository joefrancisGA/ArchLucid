using ArchLucid.Application.Analysis;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Application.Import;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch4Tests
{
    [Fact]
    public void ArchitectureCsvToGoldenManifestDryRunMapper_classifies_sql_datastore_and_api_service()
    {
        List<ArchitectureCsvComponentRow> rows =
        [
            new("Payments SQL", "Database", "Primary relational store"),
            new("Payments API", "Web API", "Public REST surface"),
        ];

        GoldenManifest manifest = ArchitectureCsvToGoldenManifestDryRunMapper.Build(rows, "run-1", "Payments");

        manifest.SystemName.Should().Be("Payments");
        manifest.Datastores.Should().ContainSingle(d => d.DatastoreType == DatastoreType.Sql);
        manifest.Services.Should().ContainSingle(s => s.ServiceType == ServiceType.Api);
        manifest.Metadata.ManifestVersion.Should().Be("dry-run-csv-import");
    }

    [Fact]
    public void PriorManifestEvidenceMapper_builds_sorted_summary_and_controls()
    {
        GoldenManifest manifest = new()
        {
            SystemName = "Claims",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v2",
                ChangeDescription = new string('x', 300),
            },
            Governance = new ManifestGovernance { RequiredControls = ["SOC2"] },
            Services =
            [
                new ManifestService { ServiceName = "B-Service", RequiredControls = ["PCI"] },
                new ManifestService { ServiceName = "A-Service" },
            ],
            Datastores = [new ManifestDatastore { DatastoreName = "SQL-1" }],
        };

        PriorManifestEvidence evidence = PriorManifestEvidenceMapper.Map(manifest);

        evidence.ManifestVersion.Should().Be("v2");
        evidence.ExistingServices.Should().Equal("A-Service", "B-Service");
        evidence.ExistingDatastores.Should().Equal("SQL-1");
        evidence.ExistingRequiredControls.Should().Contain(["PCI", "SOC2"]);
        evidence.Summary.Should().Contain("Claims");
        evidence.Summary.Length.Should().BeLessThan(400);
    }

    [Fact]
    public void ConsultingDocxExportBrandingMapper_parses_data_uri_and_rejects_invalid_base64()
    {
        byte[] logo = "logo-bytes"u8.ToArray();
        string base64 = Convert.ToBase64String(logo);
        ConsultingDocxExportBranding? branding = ConsultingDocxExportBrandingMapper.TryCreate(
            "Firm",
            "Engagement",
            $"data:image/png;base64,{base64}",
            out string? error);

        error.Should().BeNull();
        branding.Should().NotBeNull();
        branding!.FirmDisplayName.Should().Be("Firm");
        branding.LogoBytes.Should().BeEquivalentTo(logo);

        ConsultingDocxExportBranding? invalid = ConsultingDocxExportBrandingMapper.TryCreate(
            null,
            null,
            "%%%",
            out string? invalidError);

        invalid.Should().BeNull();
        invalidError.Should().Contain("base64");
    }

    [Fact]
    public void ExecDigestCompositionMarkdownFormatter_emits_highlight_sections()
    {
        ExecDigestComposition composition = new(
            WeekLabel: "2026-W28",
            ComplianceDriftMarkdown: "- drift item",
            CommittedManifestsInWeek: 3,
            TopManifestRuns: [new ExecDigestHighlightedRun("abc", 10, "pilot")],
            FindingsDeltaSummary: "2 new high findings",
            DashboardUrl: "https://app/dashboard",
            SponsorValueReportUrl: "https://app/value",
            LatestCommittedRunIdHex: null);

        string markdown = ExecDigestCompositionMarkdownFormatter.Format(composition);

        markdown.Should().Contain("2026-W28");
        markdown.Should().Contain("Findings delta");
        markdown.Should().Contain("Compliance drift");
        markdown.Should().Contain("abc");
    }

    [Fact]
    public void ArchitectureQuickScanResponseMapper_orders_by_severity_and_caps_findings()
    {
        QuickScanResult result = new()
        {
            ScanId = "scan-1",
            Summary = "summary",
            Findings =
            [
                new ArchitectureFinding { Category = "low", Message = "l", Severity = FindingSeverity.Info, ConfidenceScore = 0.2 },
                new ArchitectureFinding { Category = "high", Message = "h", Severity = FindingSeverity.Critical, ConfidenceScore = 0.9 },
                new ArchitectureFinding { Category = "med", Message = "m", Severity = FindingSeverity.Warning, ConfidenceScore = 0.5 },
            ],
        };

        ArchitectureQuickScanResponse mapped = ArchitectureQuickScanResponseMapper.Map(
            result,
            new QuickScanRequestValidator.ValidatedQuickScanRequest("sys", "Azure", null, "desc", []),
            maxFindings: 2);

        mapped.Findings.Should().HaveCount(2);
        mapped.Findings[0].Severity.Should().Be(FindingSeverity.Critical);
        mapped.Findings[1].Severity.Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public void TenantItsmConnectorConnectionMapper_maps_configured_and_empty_responses()
    {
        Guid tenantId = Guid.NewGuid();
        TenantItsmConnectorConnectionRecord row = new()
        {
            TenantId = tenantId,
            Provider = TenantItsmConnectorProvider.ServiceNow,
            IsEnabled = true,
            InstanceBaseUrl = "https://tenant.service-now.com",
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            AuthUserName = "api-user",
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        TenantItsmConnectorConnectionResponse configured = TenantItsmConnectorConnectionMapper.ToResponse(row);
        TenantItsmConnectorConnectionResponse empty =
            TenantItsmConnectorConnectionMapper.Empty(tenantId, TenantItsmConnectorProvider.Jira);

        configured.IsConfigured.Should().BeTrue();
        configured.InstanceBaseUrl.Should().Be(row.InstanceBaseUrl);
        empty.IsConfigured.Should().BeFalse();
        empty.TenantId.Should().Be(tenantId);
    }

    [Fact]
    public void FindingExplainabilityEvidenceMapper_round_trips_record_fields()
    {
        FindingExplainabilityEvidenceRecord record = new(
            ["ref-1"],
            "conclusion",
            ["alt"],
            "rule-1");

        FindingExplainabilityEvidence model = FindingExplainabilityEvidenceMapper.ToModel(record);

        model.Conclusion.Should().Be("conclusion");
        model.RuleId.Should().Be("rule-1");
        model.EvidenceRefs.Should().ContainSingle("ref-1");
    }
}
