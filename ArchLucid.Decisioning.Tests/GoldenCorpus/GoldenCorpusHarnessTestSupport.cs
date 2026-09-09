using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     Shared assertions for harness snapshots after DX-59 demotion: gate rows may land in
///     <see cref="FindingsSnapshot.ChecklistCoverage" /> instead of <see cref="FindingsSnapshot.Findings" />.
/// </summary>
internal static class GoldenCorpusHarnessTestSupport
{
    public static IEnumerable<Finding> AllFindings(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return snapshot.Findings.Concat(snapshot.ChecklistCoverage);
    }

    public static IEnumerable<string> AllFindingEngineTypes(FindingsSnapshot snapshot)
    {
        return AllFindings(snapshot).Select(static finding => finding.EngineType);
    }
}
