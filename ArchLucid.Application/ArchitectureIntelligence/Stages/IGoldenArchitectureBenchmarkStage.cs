using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public interface IGoldenArchitectureBenchmarkStage
{
    GoldenArchitectureBenchmarkAnalysis Analyze(GoldenArchitectureInvokeStageResult invokeResult);
}
