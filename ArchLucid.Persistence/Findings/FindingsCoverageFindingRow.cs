using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Findings;

/// <summary>Dapper projection for coverage finding metadata — no <c>PayloadJson</c> or child LOBs (TB-930).</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed class FindingsCoverageFindingRow
{
    public string FindingId
    {
        get;
        init;
    } = null!;

    public string FindingType
    {
        get;
        init;
    } = null!;

    public string Category
    {
        get;
        init;
    } = null!;

    public string EngineType
    {
        get;
        init;
    } = null!;

    public string Severity
    {
        get;
        init;
    } = null!;

    public string Title
    {
        get;
        init;
    } = null!;

    public string? PolicyRuleId
    {
        get;
        init;
    }
}
