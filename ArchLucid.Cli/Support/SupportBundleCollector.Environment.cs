using System.Runtime.InteropServices;

namespace ArchLucid.Cli.Support;

public static partial class SupportBundleCollector
{
    private static SupportBundleEnvironmentSection BuildEnvironmentSection()
    {
        return new SupportBundleEnvironmentSection
        {
            MachineName = Environment.MachineName,
            OsDescription = RuntimeInformation.OSDescription,
            OsArchitecture = RuntimeInformation.OSArchitecture.ToString(),
            ProcessArchitecture = RuntimeInformation.ProcessArchitecture.ToString(),
            DotnetRuntime = RuntimeInformation.FrameworkDescription,
            TimeZone = TimeZoneInfo.Local.Id,
            ArchlucidAndDotnetEnvironment = SupportBundleRedactor.SnapshotEnvironmentForBundle()
        };
    }
}
