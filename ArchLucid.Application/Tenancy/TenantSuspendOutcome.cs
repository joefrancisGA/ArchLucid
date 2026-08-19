namespace ArchLucid.Application.Tenancy;

/// <summary>Result of an admin suspend / unsuspend attempt.</summary>
public enum TenantSuspendOutcome
{
    NotFound = 0,
    InErasureQuarantine = 1,
    AlreadyInDesiredState = 2,
    Applied = 3,
}
