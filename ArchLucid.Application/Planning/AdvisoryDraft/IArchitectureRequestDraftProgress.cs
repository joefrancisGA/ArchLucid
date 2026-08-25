namespace ArchLucid.Application.Planning.AdvisoryDraft;

/// <summary>Reports honest named stages during structured-brief suggest (no fake percentages).</summary>
public interface IArchitectureRequestDraftProgress
{
    void ReportStep(string stepLabel, int currentStep, int totalSteps);
}
