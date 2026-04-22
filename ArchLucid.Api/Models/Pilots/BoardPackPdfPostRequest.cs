namespace ArchLucid.Api.Models.Pilots;

/// <summary>POST body for <c>POST /v1/pilots/board-pack.pdf</c> (quarterly UTC window).</summary>
public sealed class BoardPackPdfPostRequest
{
    /// <summary>Calendar year (UTC quarter).</summary>
    public int Year { get; set; }

    /// <summary>Quarter 1–4.</summary>
    public int Quarter { get; set; }

    /// <summary>Optional override for window start (UTC). When set, <see cref="PeriodEndUtc"/> must also be set.</summary>
    public DateTimeOffset? PeriodStartUtc { get; set; }

    /// <summary>Optional override for window end (UTC), exclusive.</summary>
    public DateTimeOffset? PeriodEndUtc { get; set; }
}
