namespace ArchiForge.Application.Analysis;

public interface IConsultingDocxExportProfileSelector
{
    ResolvedConsultingDocxExportProfile Resolve(
        string? templateProfile,
        ConsultingDocxProfileRecommendationRequest recommendationRequest);
}

