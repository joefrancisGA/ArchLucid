using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

/// <summary>BR-09 ship gate: tenant A branding must never appear in tenant B exports or resolver output.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
[Trait("BrandingShipGate", "BR-09")]
public sealed class TenantBrandingCrossTenantShipGateTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    private static readonly byte[] TenantALogo = [.. MinimalPng, .. Encoding.UTF8.GetBytes("tenant-a-logo-payload")];

    private static readonly byte[] TenantBLogo = [.. MinimalPng, .. Encoding.UTF8.GetBytes("tenant-b-logo-payload")];

    private const string SampleMermaid = """
        flowchart TD
            A[Ingress] --> B[App]
        """;

    [Fact]
    public async Task Interleaved_logo_checksum_resolution_is_isolated_per_tenant()
    {
        using TenantBrandingIntegratedTestHarness harness = new();

        await harness.SeedActiveTenantAsync(TenantA, "Tenant A Holdings", TenantALogo);
        await harness.SeedActiveTenantAsync(TenantB, "Tenant B Holdings", TenantBLogo);

        string checksumA = Convert.ToHexString(SHA256.HashData(TenantALogo));
        string checksumB = Convert.ToHexString(SHA256.HashData(TenantBLogo));

        List<TenantReportBrandingForExport?> results = [];

        for (int i = 0; i < 40; i++)
        {
            Guid tenantId = i % 2 == 0 ? TenantA : TenantB;
            harness.SetScope(tenantId);

            results.Add(await harness.ReportBrandingHelper.ResolveForExportAsync(
                tenantId,
                BrandingDisplayContext.ReportCover,
                apiBaseForLinks: null,
                CancellationToken.None));
        }

        foreach ((TenantReportBrandingForExport? branding, int index) in results.Select((r, i) => (r, i)))
        {
            branding.Should().NotBeNull();

            if (index % 2 == 0)
            {
                branding!.CompanyDisplayName.Should().Be("Tenant A Holdings");
                branding.LogoChecksumSha256Hex.Should().Be(checksumA);
                branding.LogoChecksumSha256Hex.Should().NotBe(checksumB);
            }
            else
            {
                branding!.CompanyDisplayName.Should().Be("Tenant B Holdings");
                branding.LogoChecksumSha256Hex.Should().Be(checksumB);
                branding.LogoChecksumSha256Hex.Should().NotBe(checksumA);
            }
        }
    }

    [Fact]
    public async Task Interleaved_mermaid_decorations_do_not_leak_company_names()
    {
        using TenantBrandingIntegratedTestHarness harness = new();

        await harness.SeedActiveTenantAsync(TenantA, "Tenant A Holdings", TenantALogo);
        await harness.SeedActiveTenantAsync(TenantB, "Tenant B Holdings", TenantBLogo);

        List<string> decorated = [];

        for (int i = 0; i < 40; i++)
        {
            Guid tenantId = i % 2 == 0 ? TenantA : TenantB;
            harness.SetScope(tenantId);

            decorated.Add(await harness.DiagramExportService.DecorateMermaidSourceForExportAsync(
                tenantId,
                SampleMermaid,
                BrandingDisplayContext.MermaidDiagram,
                CancellationToken.None));
        }

        decorated.Where((_, i) => i % 2 == 0).Should().OnlyContain(s => s.Contains("Tenant A Holdings"));
        decorated.Where((_, i) => i % 2 == 0).Should().NotContain(s => s.Contains("Tenant B Holdings"));
        decorated.Where((_, i) => i % 2 == 1).Should().OnlyContain(s => s.Contains("Tenant B Holdings"));
        decorated.Where((_, i) => i % 2 == 1).Should().NotContain(s => s.Contains("Tenant A Holdings"));
    }

    [Fact]
    public async Task Interleaved_diagram_png_wrappers_embed_isolated_logo_checksums()
    {
        using TenantBrandingIntegratedTestHarness harness = new();

        await harness.SeedActiveTenantAsync(TenantA, "Tenant A Holdings", TenantALogo);
        await harness.SeedActiveTenantAsync(TenantB, "Tenant B Holdings", TenantBLogo);

        byte[] checksumA = SHA256.HashData(TenantALogo);
        byte[] checksumB = SHA256.HashData(TenantBLogo);

        List<byte[]?> wrapped = [];

        for (int i = 0; i < 40; i++)
        {
            Guid tenantId = i % 2 == 0 ? TenantA : TenantB;
            harness.SetScope(tenantId);

            wrapped.Add(await harness.DiagramExportService.WrapRenderedPngForExportAsync(
                tenantId,
                MinimalPng,
                BrandingDisplayContext.ArchitectureDiagram,
                CancellationToken.None));
        }

        foreach ((byte[]? container, int index) in wrapped.Select((r, i) => (r, i)))
        {
            container.Should().NotBeNull();
            byte[]? embedded = BrandedDiagramExportContainer.TryReadLogoChecksumSha256(container!);

            embedded.Should().NotBeNull();

            if (index % 2 == 0)
                embedded.Should().BeEquivalentTo(checksumA);
            else
                embedded.Should().BeEquivalentTo(checksumB);
        }
    }

    [Fact]
    public async Task Product_brand_tenant_returns_defaults_without_tenant_checksum_markers()
    {
        using TenantBrandingIntegratedTestHarness harness = new();

        TenantReportBrandingForExport? branding = await harness.ReportBrandingHelper.ResolveForExportAsync(
            TenantA,
            BrandingDisplayContext.ReportCover,
            apiBaseForLinks: null,
            CancellationToken.None);

        branding.Should().BeNull();

        string mermaid = await harness.DiagramExportService.DecorateMermaidSourceForExportAsync(
            TenantA,
            SampleMermaid,
            BrandingDisplayContext.MermaidDiagram,
            CancellationToken.None);

        mermaid.Should().Be(SampleMermaid);

        byte[]? wrapped = await harness.DiagramExportService.WrapRenderedPngForExportAsync(
            TenantA,
            MinimalPng,
            BrandingDisplayContext.ArchitectureDiagram,
            CancellationToken.None);

        wrapped.Should().BeEquivalentTo(MinimalPng);
    }
}
