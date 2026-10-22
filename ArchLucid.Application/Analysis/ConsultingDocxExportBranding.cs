namespace ArchLucid.Application.Analysis;

/// <summary>Optional review-board packaging labels + logo bytes for the consulting DOCX cover.</summary>
public sealed record ConsultingDocxExportBranding(
    string? FirmDisplayName,
    string? EngagementTitle,
    byte[]? LogoBytes);
