namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernanceRationaleResponseDto
{
    public int SchemaVersion
    {
        get;
        set;
    }

    public string ApprovalRequestId
    {
        get;
        set;
    } = string.Empty;

    public string Summary
    {
        get;
        set;
    } = string.Empty;

    public List<string> Bullets
    {
        get;
        set;
    } = [];
}
