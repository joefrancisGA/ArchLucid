namespace ArchLucid.Core.Auth.Saml;

/// <summary>Pass/fail (or warn/info) outcome for one SAML SP configuration component.</summary>
public sealed record SamlTestConfigComponentResult(
    string Component,
    SamlTestConfigComponentStatus Status,
    string Detail);
