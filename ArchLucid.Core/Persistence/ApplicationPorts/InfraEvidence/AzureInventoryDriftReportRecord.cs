using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryClassifiedChangeRecord
{
    public AzureInventoryChangeRecord Change
    {
        get;
        init;
    } = null!;

    public AzureInventoryDriftClassification Classification
    {
        get;
        init;
    }
}

public sealed class AzureInventoryDriftReportRecord
{
    public AzureInventoryDiffSummaryRecord Summary
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AzureInventoryClassifiedChangeRecord> Changes
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryBaselineRecord> ActiveBaselines
    {
        get;
        init;
    } = [];
}
