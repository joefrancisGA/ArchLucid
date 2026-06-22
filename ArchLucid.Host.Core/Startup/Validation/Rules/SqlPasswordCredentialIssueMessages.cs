namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class SqlPasswordCredentialIssueMessages
{
    internal static string For(SqlPasswordCredentialIssueKind kind) =>
        kind switch
        {
            SqlPasswordCredentialIssueKind.PasswordPresent =>
                "ConnectionStrings:ArchLucid contains a Password. "
                + "Use Managed Identity (Authentication=Active Directory Default) instead. "
                + "Remove Password from the connection string and configure Managed Identity per "
                + "docs/security/MANAGED_IDENTITY_SQL_BLOB.md.",
            SqlPasswordCredentialIssueKind.UserIdWithoutAuthentication =>
                "ConnectionStrings:ArchLucid contains a User ID without Authentication=. "
                + "Use Managed Identity (Authentication=Active Directory Default) instead. "
                + "See docs/security/MANAGED_IDENTITY_SQL_BLOB.md.",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
        };
}
