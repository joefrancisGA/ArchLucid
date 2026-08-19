using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FirstValueReportBrandingSanitizerTests
{
    [Fact]
    public void TryBuildExportModel_keeps_https_logo_and_strips_markup_from_company_label()
    {
        TenantFirstValueReportBrandingForExport? sut = FirstValueReportBrandingSanitizer.TryBuildExportModel(
            rawLogoUrl: "https://cdn.example/logo.png?q=a",
            rawCompanyName: "  Tier <alert>Two  ");

        sut.Should().NotBeNull();

        sut!.LogoHttpsUrl.Should().StartWith("https://cdn.example/");
        sut.CompanyDisplayName.Should().Contain("Tier");
        sut.CompanyDisplayName.Should().NotContain("<");
        sut.CompanyDisplayName.Should().NotContain(">");
    }

    [Fact]
    public void TryBuildExportModel_drops_logo_when_scheme_not_https_but_keeps_company()
    {
        TenantFirstValueReportBrandingForExport? httpDenied = FirstValueReportBrandingSanitizer.TryBuildExportModel(
            "http://evil.example/x.png",
            "OK");

        httpDenied.Should().NotBeNull();
        httpDenied!.LogoHttpsUrl.Should().BeNull();
        httpDenied.CompanyDisplayName.Should().Be("OK");

        TenantFirstValueReportBrandingForExport? companyOk = FirstValueReportBrandingSanitizer.TryBuildExportModel(
            "mailto:a@example.com",
            "OK");

        companyOk.Should().NotBeNull();
        companyOk!.LogoHttpsUrl.Should().BeNull();

        TenantFirstValueReportBrandingForExport? bothBad = FirstValueReportBrandingSanitizer.TryBuildExportModel("", " ");

        bothBad.Should().BeNull();
    }
}
