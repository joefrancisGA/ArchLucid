namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>
///     One provider-neutral baseline dimension that was not evaluated during a review run.
/// </summary>
public sealed class NotAssessedQualityDimensionSnapshot
{
    public string QualityDimension
    {
        get;
        set;
    } = null!;

    public string Reason
    {
        get;
        set;
    } = null!;
}
