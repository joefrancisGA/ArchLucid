namespace ArchiForge.Application.Analysis;

public interface IConsultingDocxTemplateRecommendationService
{
    ConsultingDocxProfileRecommendation Recommend(
        ConsultingDocxProfileRecommendationRequest request);
}

