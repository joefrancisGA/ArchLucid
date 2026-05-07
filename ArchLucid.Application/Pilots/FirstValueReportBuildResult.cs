using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Canonical first-value Markdown plus evidence classification for PDF watermarks.</summary>
public sealed record FirstValueReportBuildResult(string Markdown, FirstValueEvidenceCompletenessLevel EvidenceCompleteness);
