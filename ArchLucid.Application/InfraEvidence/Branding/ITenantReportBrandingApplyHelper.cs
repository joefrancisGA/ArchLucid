using ArchLucid.Application.Analysis;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>
///     Resolves tenant report branding once and applies it across PDF, Word, and Markdown export surfaces.
/// </summary>
public interface ITenantReportBrandingApplyHelper
{
    Task<TenantReportBrandingForExport?> ResolveForExportAsync(
        Guid tenantId,
        BrandingDisplayContext context,
        string? apiBaseForLinks,
        CancellationToken cancellationToken = default);

    ConsultingDocxExportBranding MergeConsultingDocxBranding(
        TenantReportBrandingForExport? tenantBranding,
        ConsultingDocxExportBranding? callerBranding);
}
