namespace ArchLucid.Cli.Commands;

internal enum TenantIsolationNegativeTestRunListScanOutcome
{
    ForeignRunIdPresent,
    ForeignRunIdAbsent,
    ServerError,
    ScanIncomplete,
    ListUnavailable,
}
