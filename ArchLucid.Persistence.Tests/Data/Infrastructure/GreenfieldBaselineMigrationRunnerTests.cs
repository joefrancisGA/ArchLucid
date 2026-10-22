using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class GreenfieldBaselineMigrationRunnerTests
{
    [SkippableFact]
    public void GetOrderedIncrementalMigrationResourceNames_Places017_GraphSnapshots_before038_GovernanceWorkflow()
    {
        IReadOnlyList<string> names = GreenfieldBaselineMigrationRunner.GetOrderedIncrementalMigrationResourceNames();

        int graphSnapshots = names
            .Select((n, i) => (n, i))
            .First(t => t.n.Contains("017_GraphSnapshots", StringComparison.OrdinalIgnoreCase))
            .i;
        int governance = names
            .Select((n, i) => (n, i))
            .First(t => t.n.Contains("038_GovernanceWorkflow", StringComparison.OrdinalIgnoreCase))
            .i;

        graphSnapshots.Should().BeLessThan(governance);
    }

    [Theory]
    [InlineData(true, false, false, false, false, 0)]
    [InlineData(false, false, false, false, false, 1)]
    [InlineData(false, true, false, false, false, 2)]
    [InlineData(false, false, true, false, false, 2)]
    [InlineData(false, true, false, true, true, 2)]
    public void BaselineRepairPlan_Create_matches_sentinel_matrix(
        bool journal001,
        bool tenantCore,
        bool governance038,
        bool dboRuns,
        bool dboAuditEvents,
        int expectedMode)
    {
        BaselineCatalogSentinels sentinels = new(
            journal001,
            tenantCore,
            governance038,
            dboRuns,
            dboAuditEvents,
            DboRunTelemetryPresent: false);

        BaselineRepairPlan plan = BaselineRepairPlan.Create(sentinels);

        plan.Mode.Should().Be((BaselineRepairMode)expectedMode);
    }

    [Fact]
    public void BaselineRepairPlan_DriftRepair_without_AuditEvents_replays_from_017_when_Runs_missing()
    {
        BaselineCatalogSentinels sentinels = new(
            JournalRecordsInitialSchema001: false,
            TenantCoreTablesPresent: true,
            GovernanceWorkflow038Present: false,
            DboRunsPresent: false,
            DboAuditEventsPresent: false,
            DboRunTelemetryPresent: false);

        BaselineRepairPlan plan = BaselineRepairPlan.Create(sentinels);

        plan.Mode.Should().Be(BaselineRepairMode.DriftRepair);
        plan.SparseReplayMinInclusive.Should().Be(17);
    }

    [Fact]
    public void BaselineRepairPlan_DriftRepair_without_AuditEvents_replays_from_035_when_Runs_present()
    {
        BaselineCatalogSentinels sentinels = new(
            JournalRecordsInitialSchema001: false,
            TenantCoreTablesPresent: true,
            GovernanceWorkflow038Present: false,
            DboRunsPresent: true,
            DboAuditEventsPresent: false,
            DboRunTelemetryPresent: false);

        BaselineRepairPlan plan = BaselineRepairPlan.Create(sentinels);

        plan.SparseReplayMinInclusive.Should().Be(35);
    }

    [Theory]
    [InlineData("There is already an object named 'ArchitectureRequests' in the database.", 0, true)]
    [InlineData("There is already an object named 'GovernanceApprovalRequests' in the database.", 0, true)]
    [InlineData(
        "Msg 2714, Level 16, State 6, Line 1: There is already an object named 'GovernancePromotionRecords' in the database.",
        2714, true)]
    [InlineData("There is already an object named 'GovernanceEnvironmentActivations' in the database.", 2714, true)]
    [InlineData("There is already an object named 'OtherTable' in the database.", 2714, false)]
    [InlineData("select * from ArchitectureRequests", 0, false)]
    [InlineData("", 2714, false)]
    public void IsKnownDuplicateInitialMigrationTable_matches_architecture_and_governance_duplicate_messages(
        string message,
        int errorNumber,
        bool expected)
    {
        bool actual = GreenfieldBaselineMigrationRunner.IsKnownDuplicateInitialMigrationTable(message, errorNumber);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(
        "There is already an object named 'FK_ArtifactBundles_GoldenManifests_ManifestId' in the database.\r\nCould not create constraint or index. See previous errors.",
        true)]
    [InlineData("Could not create constraint or index. See previous errors. FK_ArtifactBundles_Runs_RunId", true)]
    [InlineData(
        "There is already an object named 'FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId' in the database.",
        true)]
    [InlineData(
        "Could not create constraint or index. See previous errors.\r\nThere is already an object named 'FK_FindingsSnapshots_Runs_RunId' in the database.",
        true)]
    [InlineData(
        "There is already an object named 'FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId' in the database.",
        true)]
    [InlineData("There is already an object named 'FK_Other' in the database.", false)]
    [InlineData("Could not create constraint or index.", false)]
    public void IsKnownDuplicateBaselineConstraintName_matches_artifact_bundle_duplicate_fk_messages(string message,
        bool expected)
    {
        bool actual = GreenfieldBaselineMigrationRunner.IsKnownDuplicateBaselineConstraintName(message);

        actual.Should().Be(expected);
    }
}
