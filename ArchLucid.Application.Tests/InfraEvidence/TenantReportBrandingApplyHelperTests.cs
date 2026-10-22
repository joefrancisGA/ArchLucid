using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Tests.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class TenantReportBrandingApplyHelperTests
{
    [Fact]
    public void MergeConsultingDocxBranding_prefers_caller_override_then_tenant_defaults()
    {
        TenantReportBrandingApplyHelper helper = new(
            FirstValueReportBrandingTestDoubles.CreateActiveTenantBrandService("Fabrikam Holdings").Object);

        TenantReportBrandingForExport tenant = new()
        {
            CompanyDisplayName = "Fabrikam Holdings",
            LogoBytes = FirstValueReportBrandingTestDoubles.TenantALogo,
            UsesTenantVisualBrand = true,
        };

        ConsultingDocxExportBranding merged = helper.MergeConsultingDocxBranding(
            tenant,
            new ConsultingDocxExportBranding("Caller Firm", "Q3 Review", [9, 9, 9]));

        merged.FirmDisplayName.Should().Be("Caller Firm");
        merged.EngagementTitle.Should().Be("Q3 Review");
        merged.LogoBytes.Should().BeEquivalentTo([9, 9, 9]);
    }

    [Fact]
    public void MergeConsultingDocxBranding_falls_back_to_tenant_when_caller_fields_missing()
    {
        TenantReportBrandingApplyHelper helper = new(
            FirstValueReportBrandingTestDoubles.CreateActiveTenantBrandService("Fabrikam Holdings").Object);

        TenantReportBrandingForExport tenant = new()
        {
            CompanyDisplayName = "Fabrikam Holdings",
            LogoBytes = FirstValueReportBrandingTestDoubles.TenantALogo,
            UsesTenantVisualBrand = true,
        };

        ConsultingDocxExportBranding merged = helper.MergeConsultingDocxBranding(tenant, null);

        merged.FirmDisplayName.Should().Be("Fabrikam Holdings");
        merged.LogoBytes.Should().BeEquivalentTo(FirstValueReportBrandingTestDoubles.TenantALogo);
    }
}
