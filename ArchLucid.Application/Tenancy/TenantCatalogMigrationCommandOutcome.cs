namespace ArchLucid.Application.Tenancy;

public enum TenantCatalogMigrationCommandOutcome
{
    Applied = 0,
    NotFound = 1,
    AlreadyActive = 2,
    NoActiveMigration = 3,
    VerificationRequired = 4,
    VerificationFailed = 5,
    AlreadyInDesiredState = 6,
    WrongStage = 7,
}
