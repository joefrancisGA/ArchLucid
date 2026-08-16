using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Findings;

/// <summary>Inputs for AWS/GCP extractor-grounded cost recommendation findings (TB-2215).</summary>
internal sealed record CloudCostRecommendationFindingRequest(
    IScopeContextProvider ScopeContextProvider,
    ICloudInventoryExtractorPackageRepository PackageRepository,
    TimeProvider Clock,
    RoiCostEvidenceFreshnessOptions FreshnessOptions,
    CloudProvider CloudProvider,
    string EngineType,
    string FindingType,
    string DefaultTitle,
    string DefaultIdPrefix,
    string Rationale,
    string RuleApplied,
    string DecisionTaken);
