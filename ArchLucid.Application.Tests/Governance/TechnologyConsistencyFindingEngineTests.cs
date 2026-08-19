using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TechnologyConsistencyFindingEngineTests
{
    private readonly TechnologyConsistencyFindingEngine _engine = new();

    [Fact]
    public void Evaluate_returns_empty_when_ledger_is_empty()
    {
        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            [],
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_warn_only_emits_warning_severity()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.CloudPlatform, "Microsoft Azure", CloudProvider.Azure),
            Chosen(TechnologyLedgerRole.PrimaryDatastore, "Amazon RDS", CloudProvider.Aws),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions { Mode = TechnologyConsistencyFindingEngineMode.WarnOnly });

        findings.Should().ContainSingle(f => f.Title == "ConflictingChosenProviderFamily");
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        findings[0].EngineType.Should().Be("TechnologyConsistencyFindingEngine");
    }

    [Fact]
    public void Evaluate_enforcing_emits_error_severity()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.CloudPlatform, "Microsoft Azure", CloudProvider.Azure),
            Chosen(TechnologyLedgerRole.PrimaryDatastore, "Amazon RDS", CloudProvider.Aws),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions { Mode = TechnologyConsistencyFindingEngineMode.Enforcing });

        findings.Should().ContainSingle(f => f.Title == "ConflictingChosenProviderFamily");
        findings[0].Severity.Should().Be(FindingSeverity.Error);
    }

    [Fact]
    public void Evaluate_duplicate_chosen_role_emits_one_finding_per_role()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.PrimaryDatastore, "Azure SQL", CloudProvider.Azure, "e1"),
            Chosen(TechnologyLedgerRole.PrimaryDatastore, "Azure SQL Managed", CloudProvider.Azure, "e2"),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().ContainSingle(f => f.Title == "DuplicateChosenLedgerRole");
        findings[0].Properties[FindingPropertyKeys.TechnologyLedgerEntryIds].Should().Contain("e1");
    }

    [Fact]
    public void Evaluate_cloud_neutral_leak_emits_dedicated_title()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.CloudPlatform, "Cloud-neutral", CloudProvider.None),
            Chosen(TechnologyLedgerRole.ComputeRuntime, "Azure App Service", CloudProvider.Azure),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().ContainSingle(f => f.Title == "CloudNeutralProviderLeak");
    }

    [Fact]
    public void Evaluate_missing_chosen_cloud_platform_when_dependent_rows_exist()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.Region, "eastus", CloudProvider.Azure),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().ContainSingle(f => f.Title == "MissingChosenCloudPlatform");
    }

    [Fact]
    public void Evaluate_locked_chosen_overridden_by_assumed()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.PrimaryDatastore, "Azure SQL", CloudProvider.Azure, "chosen-1", isLocked: true),
            Assumed(TechnologyLedgerRole.PrimaryDatastore, "Amazon RDS", CloudProvider.Aws, "assumed-1"),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().ContainSingle(f => f.Title == "LockedChosenOverriddenByAssumed");
    }

    [Fact]
    public void Evaluate_assumed_rows_do_not_trigger_cross_family_findings()
    {
        List<TechnologyLedgerEntry> ledger =
        [
            Chosen(TechnologyLedgerRole.CloudPlatform, "Microsoft Azure", CloudProvider.Azure),
            Assumed(TechnologyLedgerRole.PrimaryDatastore, "Amazon RDS", CloudProvider.Aws),
        ];

        IReadOnlyList<Finding> findings = _engine.Evaluate(
            "run-1",
            ledger,
            new TechnologyConsistencyFindingEngineOptions());

        findings.Should().BeEmpty();
    }

    private static TechnologyLedgerEntry Chosen(
        TechnologyLedgerRole role,
        string technologyName,
        CloudProvider providerFamily,
        string? entryId = null,
        bool isLocked = false) =>
        new()
        {
            EntryId = entryId ?? Guid.NewGuid().ToString("N"),
            RunId = "run-1",
            Role = role,
            TechnologyName = technologyName,
            ProviderFamily = providerFamily,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = isLocked,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static TechnologyLedgerEntry Assumed(
        TechnologyLedgerRole role,
        string technologyName,
        CloudProvider providerFamily,
        string? entryId = null) =>
        new()
        {
            EntryId = entryId ?? Guid.NewGuid().ToString("N"),
            RunId = "run-1",
            Role = role,
            TechnologyName = technologyName,
            ProviderFamily = providerFamily,
            Status = TechnologyLedgerStatus.Assumed,
            Source = TechnologyLedgerSource.AgentProposed,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
