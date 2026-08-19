using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Slim finding row for buyer-summary first paint (TB-930) — no payload LOB.
/// </summary>
public sealed class BuyerFindingSummaryDto
{
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string Category
    {
        get;
        set;
    } = string.Empty;

    public FindingSeverity Severity
    {
        get;
        set;
    }

    public string EngineType
    {
        get;
        set;
    } = string.Empty;

    public string? PolicyRuleId
    {
        get;
        set;
    }
}
