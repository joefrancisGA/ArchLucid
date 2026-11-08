namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernancePromotionResponseDto
{
    public string PromotionRecordId
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

    public string TargetEnvironment
    {
        get;
        set;
    } = string.Empty;

    public string PromotedBy
    {
        get;
        set;
    } = string.Empty;

    public string? ApprovalRequestId
    {
        get;
        set;
    }
}
