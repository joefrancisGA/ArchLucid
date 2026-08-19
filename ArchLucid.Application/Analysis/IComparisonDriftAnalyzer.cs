namespace ArchLucid.Application.Analysis;

public interface IComparisonDriftAnalyzer
{
    DriftAnalysisResult Analyze(
        object stored,
        object regenerated);
}
