namespace ArchLucid.Application.Analysis;

/// <summary>
///     Auditable stratified compare counts for coverage and quality delta (assessment item 52 / TB-2317).
///     Field names align with <c>archlucid-ui/src/lib/review-quality/compare-quality-delta.ts</c>.
/// </summary>
public sealed class CompareQualityDeltaCounts
{
    public int UnsupportedAssumptionsBefore
    {
        get;
        set;
    }

    public int UnsupportedAssumptionsAfter
    {
        get;
        set;
    }

    public int HighSeverityBefore
    {
        get;
        set;
    }

    public int HighSeverityAfter
    {
        get;
        set;
    }

    public int UncoveredMandatoryBefore
    {
        get;
        set;
    }

    public int UncoveredMandatoryAfter
    {
        get;
        set;
    }

    public int EvidenceBackedDecisionsBefore
    {
        get;
        set;
    }

    public int EvidenceBackedDecisionsAfter
    {
        get;
        set;
    }
}
