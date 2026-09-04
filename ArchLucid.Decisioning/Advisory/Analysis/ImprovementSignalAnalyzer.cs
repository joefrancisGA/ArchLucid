namespace ArchLucid.Decisioning.Advisory.Analysis;

/// <summary>
///     Default <see cref="IImprovementSignalAnalyzer" /> implementation driven by manifest gaps and
///     <see cref="ComparisonResult" /> deltas.
/// </summary>
public sealed partial class ImprovementSignalAnalyzer : IImprovementSignalAnalyzer
{
    private const string ChangeTypeRemoved = "Removed";
}
