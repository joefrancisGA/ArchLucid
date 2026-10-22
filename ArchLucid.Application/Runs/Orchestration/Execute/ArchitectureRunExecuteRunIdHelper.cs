namespace ArchLucid.Application.Runs.Orchestration.Execute;

internal static class ArchitectureRunExecuteRunIdHelper
{
    internal static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
