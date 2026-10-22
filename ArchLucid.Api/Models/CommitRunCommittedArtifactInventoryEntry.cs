using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class CommitRunCommittedArtifactInventoryEntry
{
    public string ArtifactName
    {
        get;
        set;
    } = string.Empty;

    public string ContentType
    {
        get;
        set;
    } = string.Empty;

    public string ContentHashSha256
    {
        get;
        set;
    } = string.Empty;

    public string Producer
    {
        get;
        set;
    } = string.Empty;

    public DateTime CapturedUtc
    {
        get;
        set;
    }
}
