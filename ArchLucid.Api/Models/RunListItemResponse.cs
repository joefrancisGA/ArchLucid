using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>Compact run entry returned by the run list endpoint.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class RunListItemResponse
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

    /// <summary>Golden manifest id when the run has a committed signed record.</summary>
    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when <see cref="GoldenManifestId" /> is set.</summary>
    public bool HasGoldenManifest
    {
        get;
        set;
    }
}
