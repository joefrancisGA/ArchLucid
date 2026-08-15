using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class DeclaredPrioritySpecialistDepthSelector
{
  private static readonly QualityDimension[] BaselineDimensions =
  [
      QualityDimension.Reliability,
      QualityDimension.Security,
      QualityDimension.Cost,
  ];

  public static IReadOnlyList<QualityDimension> SelectDimensions(IReadOnlyList<string> declaredPriorities)
  {
    HashSet<QualityDimension> dimensions = BaselineDimensions.ToHashSet();

    if (declaredPriorities is null || declaredPriorities.Count == 0)
    {
      return OrderDimensions(dimensions);
    }

    foreach (string priority in declaredPriorities)
    {
      if (string.IsNullOrWhiteSpace(priority))
      {
        continue;
      }

      if (ContainsPriorityToken(priority, "security"))
      {
        dimensions.Add(QualityDimension.PrivacyCompliance);
        dimensions.Add(QualityDimension.AiSpecificRisk);
      }

      if (ContainsPriorityToken(priority, "reliability"))
      {
        dimensions.Add(QualityDimension.Operations);
        dimensions.Add(QualityDimension.PerformanceScalability);
      }

      if (ContainsPriorityToken(priority, "cost"))
      {
        dimensions.Add(QualityDimension.Maintainability);
      }

      if (ContainsPriorityToken(priority, "performance"))
      {
        dimensions.Add(QualityDimension.PerformanceScalability);
      }

      if (ContainsPriorityToken(priority, "compliance")
          || ContainsPriorityToken(priority, "privacy"))
      {
        dimensions.Add(QualityDimension.PrivacyCompliance);
        dimensions.Add(QualityDimension.DataArchitecture);
      }

      if (ContainsPriorityToken(priority, "integration"))
      {
        dimensions.Add(QualityDimension.Integration);
      }

      if (ContainsPriorityToken(priority, "operations"))
      {
        dimensions.Add(QualityDimension.Operations);
      }
    }

    return OrderDimensions(dimensions);
  }

  private static bool ContainsPriorityToken(string priority, string token)
  {
    return priority.Contains(token, StringComparison.OrdinalIgnoreCase);
  }

  private static IReadOnlyList<QualityDimension> OrderDimensions(HashSet<QualityDimension> dimensions)
  {
    return dimensions
        .OrderBy(dimension => dimension)
        .ToList();
  }
}
