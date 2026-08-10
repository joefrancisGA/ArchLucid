using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Lightweight run summary for list endpoints and dashboard views.
///     Sourced from <c>IRunDetailQueryService.ListRunSummariesAsync</c>.
/// </summary>
public sealed class RunSummary
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string RequestId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Status string (e.g. "Committed", "ReadyForCommit") matching <c>ArchitectureRunStatus</c> names.</summary>
    public string Status
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime? CompletedUtc
    {
        get;
        set;
    }

    public string? CurrentManifestVersion
    {
        get;
        set;
    }

    public string SystemName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Package origin for list badges (<c>Created</c> | <c>Reviewed</c>).</summary>
    public string? PackageOrigin
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" />, deferred authority pipeline work dead-lettered after retry exhaustion.
    /// </summary>
    public bool IsDeadLettered
    {
        get;
        set;
    }

    /// <summary>Golden manifest id when the run has a committed signed record.</summary>
    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when <see cref="GoldenManifestId" /> is set.</summary>
    public bool HasGoldenManifest => GoldenManifestId.HasValue;

    /// <summary>SQL <c>ROWVERSION</c> for conditional GET; not exposed in list API payloads.</summary>
    [JsonIgnore]
    public byte[]? RowVersion
    {
        get;
        set;
    }
}
