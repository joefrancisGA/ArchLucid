using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest;

using FluentAssertions;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
///     Offline content-SHA capture for <c>tests/golden-cohort/cohort.json</c> when API integration hosts cannot run.
///     Mirrors authority commit projection inputs that the Simulator topology/compliance proposals produce.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "GoldenCohort")]
public sealed class GoldenCohortContentBaselineGeneratorTests
{
    private const string AuthoritySummary =
        "Resolved architecture state generated from graph findings and rule evaluation.";

    [Fact]
    public async Task Content_sha_is_stable_for_same_cohort_item()
    {
        GoldenCohortDocument document = LoadCohort();
        GoldenCohortItem item = document.Items[0];

        string first = await ComputeAuthorityContentShaAsync(item);
        string second = await ComputeAuthorityContentShaAsync(item);

        first.Should().Be(second);
        first.Length.Should().Be(64);
    }

    [Fact]
    public async Task Write_content_baseline_actuals_when_approved()
    {
        GoldenCohortDocument document = LoadCohort();
        List<object> rows = [];

        foreach (GoldenCohortItem item in document.Items)
        {
            string sha = await ComputeAuthorityContentShaAsync(item);
            rows.Add(new { id = item.Id, committedManifestSha256 = sha.ToLowerInvariant() });

            if (IsTruthy("ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED"))
                item.ExpectedCommittedManifestSha256 = sha.ToLowerInvariant();
        }

        string reportRoot = Environment.GetEnvironmentVariable("ARCHLUCID_GOLDEN_COHORT_DRIFT_REPORT_ROOT")
                            ?? Path.Combine(Directory.GetCurrentDirectory(), "artifacts", "golden-cohort-drift");
        Directory.CreateDirectory(reportRoot);
        string actualsPath = Path.Combine(reportRoot, "golden-cohort-drift-actuals.json");
        await File.WriteAllTextAsync(
            actualsPath,
            JsonSerializer.Serialize(rows, ContractJson.CamelCaseIgnoreNullIndented));

        File.Exists(actualsPath).Should().BeTrue();

        if (IsTruthy("ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED"))
        {
            string? repoCohort = TryResolveRepoCohortPath();
            repoCohort.Should().NotBeNullOrWhiteSpace();
            document.Save(repoCohort!);
        }
    }

    private static async Task<string> ComputeAuthorityContentShaAsync(GoldenCohortItem item)
    {
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(item);
        const string runId = "golden-cohort-content-baseline";
        const string topologyTaskId = "task-topology";
        const string complianceTaskId = "task-compliance";

        AgentResult topology = FakeScenarioFactory.CreateTopologyResult(runId, topologyTaskId, request);
        AgentResult compliance = FakeScenarioFactory.CreateComplianceResult(runId, complianceTaskId, request);
        AgentTopologyProposal? topologyProposal = topology.ProposedChanges;
        AgentTopologyProposal? complianceProposal = compliance.ProposedChanges;

        topologyProposal.Should().NotBeNull();
        complianceProposal.Should().NotBeNull();

        ManifestDocument model = new()
        {
            ManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ContextSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            GraphSnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            FindingsSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            DecisionTraceId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            CreatedUtc = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            ManifestHash = "simulator-content-baseline",
            RuleSetId = "simulator",
            RuleSetVersion = "1.0.0",
            RuleSetHash = "simulator",
            Metadata = new ArchLucid.Core.Manifest.Sections.ManifestMetadata
            {
                Name = $"ArchLucid Manifest {runId}",
                Version = "1.0.0",
                Status = "Resolved",
                Summary = AuthoritySummary
            }
        };

        model.Topology.Services.AddRange(topologyProposal!.AddedServices);
        model.Topology.Datastores.AddRange(topologyProposal.AddedDatastores);
        model.Topology.Relationships.AddRange(topologyProposal.AddedRelationships);

        foreach (string control in complianceProposal!.RequiredControls.Where(c => !string.IsNullOrWhiteSpace(c)))
        {
            model.Security.Controls.Add(
                new SecurityPostureItem
                {
                    ControlId = control.Trim(),
                    ControlName = control.Trim(),
                    Status = "present",
                    Impact = "required"
                });
        }

        IAuthorityCommitProjectionBuilder projection = new AuthorityCommitProjectionBuilder();
        Cm.GoldenManifest contract = await projection.BuildAsync(
            model,
            new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            CancellationToken.None);

        return GoldenManifestFingerprint.ComputeContentSha256Hex(contract);
    }

    private static GoldenCohortDocument LoadCohort()
    {
        string? repoCohort = TryResolveRepoCohortPath();
        string cohortPath = repoCohort
                            ?? Path.Combine(AppContext.BaseDirectory, "golden-cohort", "cohort.json");

        File.Exists(cohortPath).Should().BeTrue($"Missing cohort at {cohortPath}");

        return GoldenCohortDocument.Load(cohortPath);
    }

    private static string? TryResolveRepoCohortPath()
    {
        DirectoryInfo? dir = new(Directory.GetCurrentDirectory());

        while (dir is not null)
        {
            string candidate = Path.Combine(dir.FullName, "tests", "golden-cohort", "cohort.json");

            if (File.Exists(candidate))
                return candidate;

            dir = dir.Parent;
        }

        return null;
    }

    private static bool IsTruthy(string name)
    {
        string? raw = Environment.GetEnvironmentVariable(name);

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string v = raw.Trim();

        return string.Equals(v, "1", StringComparison.Ordinal)
               || string.Equals(v, "true", StringComparison.OrdinalIgnoreCase)
               || string.Equals(v, "yes", StringComparison.OrdinalIgnoreCase);
    }
}
