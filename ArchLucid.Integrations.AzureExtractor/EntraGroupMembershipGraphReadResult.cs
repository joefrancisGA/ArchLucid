using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class EntraGroupMembershipGraphReadResult
{
    public bool Forbidden
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEntraGroupMembershipRow> Memberships
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> NestedGroupIds
    {
        get;
        init;
    } = [];

    public static EntraGroupMembershipGraphReadResult Empty() =>
        new();

    public static EntraGroupMembershipGraphReadResult ForbiddenResult(string warning) =>
        new()
        {
            Forbidden = true,
            Warnings = [warning],
        };
}
