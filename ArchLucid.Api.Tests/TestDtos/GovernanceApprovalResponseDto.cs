namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernanceApprovalResponseDto
{
    public string ApprovalRequestId
    {
        get;
        set;
    } = string.Empty;

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string ManifestVersion
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string RequestedBy
    {
        get;
        set;
    } = string.Empty;

    public string? ReviewedBy
    {
        get;
        set;
    }

    public string? ReviewComment
    {
        get;
        set;
    }
}
