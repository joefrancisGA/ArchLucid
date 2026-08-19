namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Repair strategy chosen from <see cref="BaselineCatalogSentinels" /> (TB-069).</summary>
internal enum BaselineRepairMode
{
    None,
    FullReplay,
    DriftRepair,
}

/// <summary>
///     Describes how <see cref="GreenfieldBaselineMigrationRunner" /> should repair a catalog before DbUp continues at
///     <c>051+</c>.
/// </summary>
internal readonly record struct BaselineRepairPlan(
    BaselineRepairMode Mode,
    int? SparseReplayMinInclusive,
    int SparseReplayMaxInclusive = 50)
{
    public static BaselineRepairPlan None { get; } = new(BaselineRepairMode.None, null);

    public static BaselineRepairPlan FullReplay { get; } = new(BaselineRepairMode.FullReplay, null);

    public static BaselineRepairPlan Create(BaselineCatalogSentinels sentinels)
    {
        if (sentinels.JournalRecordsInitialSchema001)
            return None;

        if (sentinels.RequiresDriftRepair)
            return CreateDriftRepair(sentinels);

        return FullReplay;
    }

    private static BaselineRepairPlan CreateDriftRepair(BaselineCatalogSentinels sentinels)
    {
        if (sentinels.DboAuditEventsPresent)
            return new BaselineRepairPlan(BaselineRepairMode.DriftRepair, null);

        int minInclusive = sentinels.DboRunsPresent ? 35 : 17;

        return new BaselineRepairPlan(BaselineRepairMode.DriftRepair, minInclusive);
    }
}
