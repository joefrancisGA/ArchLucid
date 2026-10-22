namespace ArchLucid.Api.Demo;

public sealed class DemoQuickStartRequest
{
    /// <summary>Free-form architecture narrative (ignored when preset supplies full prose unless combined).</summary>
    public string? Description
    {
        get;
        set;
    }

    /// <summary>Optional preset key from <see cref="QuickStartPresets.Items" /> keys.</summary>
    public string? PresetId
    {
        get;
        set;
    }
}

public sealed class DemoQuickStartFindingSummary
{
    /// <summary>Primary human-readable line (finding message).</summary>
    public string Title
    {
        get;
        init;
    } = string.Empty;

    /// <summary><see cref="Contracts.Findings.FindingSeverity" /> name.</summary>
    public string Severity
    {
        get;
        init;
    } = string.Empty;
}

public sealed class DemoQuickStartResponse
{
    /// <summary>Canonical run identifier (string form of GUID).</summary>
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Committed golden manifest semantic version string.</summary>
    public string ManifestId
    {
        get;
        init;
    } = string.Empty;

    public List<DemoQuickStartFindingSummary> TopFindings
    {
        get;
        init;
    } = [];

    /// <summary>Public operator-shell deep link (<c>{{PublicSite}}/runs/{{runId}}</c>).</summary>
    public string RunDetailUrl
    {
        get;
        init;
    } = string.Empty;
}
