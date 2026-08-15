namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>Honest evidence label for sponsor-facing findings (TB-2340 item 46).</summary>
public enum EvidenceSupportTier
{
  Unverified = 0,
  SemanticInferenceFromPartialEvidence = 1,
  IntegrityVerified = 2,
}
