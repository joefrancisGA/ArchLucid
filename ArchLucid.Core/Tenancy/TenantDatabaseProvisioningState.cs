namespace ArchLucid.Core.Tenancy;

public enum TenantDatabaseProvisioningState : byte
{
    Pending = 0,
    Active = 1,
    Failed = 2,
}
