using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Architecture;

/// <summary>Diff kind labels aligned with authority compare (PC-06).</summary>
internal static class ArchitectureSealDeltaDiffKind
{
    internal const string Added = "Added";
    internal const string Removed = "Removed";
    internal const string Changed = "Changed";
}

/// <summary>Diff helpers for sealed manifest vs projected draft snapshot (PC-06).</summary>
internal static class ArchitectureSealDeltaComparer
{
    internal static List<ArchitectureSealDeltaItem> Compare(
        ManifestDocument sealedManifest,
        DraftRequestDocument draftDocument,
        ArchitectureRequest projectedDraft)
    {
        List<ArchitectureSealDeltaItem> diffs = [];

        CompareStringLists(
            diffs,
            "Assumptions",
            sealedManifest.Assumptions,
            projectedDraft.Assumptions);

        TransparencyTrail sealedTrail =
            sealedManifest.FeasibilityVerdict?.TransparencyTrail ?? new TransparencyTrail();

        CompareAssertedTrail(diffs, sealedTrail, draftDocument.TransparencyTrail);
        CompareInferredTrail(diffs, sealedTrail, draftDocument.TransparencyTrail);

        return diffs;
    }

    private static void CompareStringLists(
        List<ArchitectureSealDeltaItem> diffs,
        string section,
        IReadOnlyList<string>? baseline,
        IReadOnlyList<string>? current)
    {
        HashSet<string> baselineSet = new(baseline ?? [], StringComparer.OrdinalIgnoreCase);
        HashSet<string> currentSet = new(current ?? [], StringComparer.OrdinalIgnoreCase);

        foreach (string item in baselineSet.Except(currentSet, StringComparer.OrdinalIgnoreCase))
        {
            diffs.Add(new ArchitectureSealDeltaItem
            {
                Section = section,
                Key = item,
                DiffKind = ArchitectureSealDeltaDiffKind.Removed,
                BeforeValue = item,
            });
        }

        foreach (string item in currentSet.Except(baselineSet, StringComparer.OrdinalIgnoreCase))
        {
            diffs.Add(new ArchitectureSealDeltaItem
            {
                Section = section,
                Key = item,
                DiffKind = ArchitectureSealDeltaDiffKind.Added,
                AfterValue = item,
            });
        }
    }

    private static void CompareAssertedTrail(
        List<ArchitectureSealDeltaItem> diffs,
        TransparencyTrail baseline,
        TransparencyTrail current)
    {
        Dictionary<string, string> baselineMap = ToTrailMap(
            baseline.Asserted,
            static entry => entry.Key,
            static entry => entry.Value);

        Dictionary<string, string> currentMap = ToTrailMap(
            current.Asserted,
            static entry => entry.Key,
            static entry => entry.Value);

        CompareTrailMaps(diffs, "Asserted", baselineMap, currentMap);
    }

    private static void CompareInferredTrail(
        List<ArchitectureSealDeltaItem> diffs,
        TransparencyTrail baseline,
        TransparencyTrail current)
    {
        Dictionary<string, string> baselineMap = ToTrailMap(
            baseline.Inferred,
            static entry => entry.Key,
            static entry => $"{entry.Value} (confidence {entry.Confidence})");

        Dictionary<string, string> currentMap = ToTrailMap(
            current.Inferred,
            static entry => entry.Key,
            static entry => $"{entry.Value} (confidence {entry.Confidence})");

        CompareTrailMaps(diffs, "Inferred", baselineMap, currentMap);
    }

    private static Dictionary<string, string> ToTrailMap<T>(
        IEnumerable<T> entries,
        Func<T, string> keySelector,
        Func<T, string> valueSelector)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (T entry in entries)
        {
            string key = keySelector(entry).Trim();

            if (key.Length == 0)
                continue;

            map[key] = valueSelector(entry).Trim();
        }

        return map;
    }

    private static void CompareTrailMaps(
        List<ArchitectureSealDeltaItem> diffs,
        string section,
        Dictionary<string, string> baseline,
        Dictionary<string, string> current)
    {
        foreach (string key in baseline.Keys.Except(current.Keys, StringComparer.OrdinalIgnoreCase))
        {
            diffs.Add(new ArchitectureSealDeltaItem
            {
                Section = section,
                Key = key,
                DiffKind = ArchitectureSealDeltaDiffKind.Removed,
                BeforeValue = baseline[key],
            });
        }

        foreach (string key in current.Keys.Except(baseline.Keys, StringComparer.OrdinalIgnoreCase))
        {
            diffs.Add(new ArchitectureSealDeltaItem
            {
                Section = section,
                Key = key,
                DiffKind = ArchitectureSealDeltaDiffKind.Added,
                AfterValue = current[key],
            });
        }

        foreach (string key in baseline.Keys.Intersect(current.Keys, StringComparer.OrdinalIgnoreCase))
        {
            string beforeValue = baseline[key];
            string afterValue = current[key];

            if (string.Equals(beforeValue, afterValue, StringComparison.Ordinal))
                continue;

            diffs.Add(new ArchitectureSealDeltaItem
            {
                Section = section,
                Key = key,
                DiffKind = ArchitectureSealDeltaDiffKind.Changed,
                BeforeValue = beforeValue,
                AfterValue = afterValue,
            });
        }
    }
}
