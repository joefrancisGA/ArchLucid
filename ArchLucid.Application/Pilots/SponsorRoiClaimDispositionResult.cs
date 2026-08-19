using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Resolved sponsor ROI narrative gate inputs for Markdown, PDF, and DOCX surfaces.</summary>
public sealed record SponsorRoiClaimDispositionResult(
    SponsorRoiClaimDisposition Disposition,
    PilotRoiEvidenceConfidence EvidenceConfidence,
    string BasisClassSummary,
    bool ProjectedDollarClaimsSponsorSafe,
    string DispositionLeadLine,
    string NarrativeBlock);
