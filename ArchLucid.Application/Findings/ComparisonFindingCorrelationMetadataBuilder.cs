using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Builds comparison-export correlation metadata from a cross-review correlation result.</summary>
public static class ComparisonFindingCorrelationMetadataBuilder
{
  public static ComparisonFindingCorrelationMetadata Build(CrossReviewFindingCorrelationResult correlation)
  {
    ArgumentNullException.ThrowIfNull(correlation);

    ComparisonFindingCorrelationMetadata metadata = new()
    {
      PolicyRuleMatchCount = correlation.PolicyRuleMatchCount,
      FuzzyMatchCount = correlation.FuzzyMatchCount,
      UnmatchedLeftCount = correlation.UnmatchedLeftFindingIds.Count,
      UnmatchedRightCount = correlation.UnmatchedRightFindingIds.Count,
    };

    if (correlation.FuzzyMatchCount > 0 && correlation.PolicyRuleMatchCount > 0)
    {
      metadata.PrimaryCorrelationMethod = "Mixed";
      metadata.HonestyNote =
        "Some finding pairs matched on policy rule + fingerprint; others matched on category/message only (possible match — not deterministic identity).";
    }
    else if (correlation.FuzzyMatchCount > 0)
    {
      metadata.PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.MessageCategoryFuzzy);
      metadata.HonestyNote =
        "Finding pairs matched on normalized category and message only — possible match; exports do not claim deterministic cross-run identity.";
    }
    else
    {
      metadata.PrimaryCorrelationMethod = nameof(FindingCorrelationMethod.PolicyRuleAndFingerprint);
      metadata.HonestyNote =
        "Finding pairs matched on policy rule id and normalized fingerprint when both sides exposed a policy rule.";
    }

    return metadata;
  }
}
