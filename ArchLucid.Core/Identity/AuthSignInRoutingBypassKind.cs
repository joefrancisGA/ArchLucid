namespace ArchLucid.Core.Identity;

public enum AuthSignInRoutingBypassKind
{
    None = 0,
    Invitation = 1,
    RecoveryAdmin = 2,
    PlatformGrant = 3
}
