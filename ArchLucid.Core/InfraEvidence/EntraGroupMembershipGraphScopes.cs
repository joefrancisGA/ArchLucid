namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Documented least-privilege Graph scopes for SA-20 — not Entra Global Reader.
/// </summary>
public static class EntraGroupMembershipGraphScopes
{
    public const string PreferredScope = "GroupMember.Read.All";

    public const string AlternateScope = "Group.Read.All";

    public const string GraphDefaultScope = "https://graph.microsoft.com/.default";
}
