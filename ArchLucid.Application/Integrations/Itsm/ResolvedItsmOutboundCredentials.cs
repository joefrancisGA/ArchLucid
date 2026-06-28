namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Resolved outbound ITSM credentials for one vendor call (never log <see cref="SecretValue" />).</summary>
public sealed record ResolvedItsmOutboundCredentials(
    string InstanceBaseUrl,
    string AuthUserName,
    string SecretValue,
    bool FromTenantConnection);
