namespace ArchLucid.Contracts.Notifications;

/// <summary>Highlighted committed review row for tokenized digest sponsor dashboard view (TB-2196).</summary>
public sealed class ExecDigestSponsorDeepLinkHighlightedRunDto
{
    public string RunIdHex { get; init; } = string.Empty;

    public int SignificanceScore { get; init; }

    public string? Caption { get; init; }
}
