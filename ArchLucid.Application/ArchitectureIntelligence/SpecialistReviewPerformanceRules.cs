using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic performance and scalability specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewPerformanceRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);
        bool hasCapacityElement = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.CapacityExpectation);

        if (!SpecialistReviewModelTextSignals.ContainsLoadSignal(searchText))
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.PerformanceScalability,
                "No explicit load target detected for capacity review",
                "Performance review did not find stated throughput or user-load targets requiring capacity planning.");
        }

        if (!hasCapacityElement)
        {
            openQuestions.Add("What peak load (users, RPS, or throughput) must the architecture support?");

            return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
                model,
                QualityDimension.PerformanceScalability,
                "Load targets stated without capacity expectation",
                "Load or throughput signals appear in the model, but no CapacityExpectation element documents how the design scales.");
        }

        ArchitectureModelElement? capacityElement = model.Elements.First(
            element => element.Kind == ArchitectureElementKind.CapacityExpectation);

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.PerformanceScalability,
            "Capacity expectation documents stated load context",
            "A capacity expectation element is present alongside load signals in the architecture model.",
            capacityElement);
    }
}
