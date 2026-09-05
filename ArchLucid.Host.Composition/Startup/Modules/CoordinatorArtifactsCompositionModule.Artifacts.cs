using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class CoordinatorArtifactsCompositionModule
{
    private static void RegisterArtifacts(IServiceCollection services)
    {
        RegisterInfrastructureCostSizing(services);

        services.AddSingleton<IArtifactContentTypeResolver, ArtifactContentTypeResolver>();
        services.AddSingleton<IArtifactPackagingService, ArtifactPackagingService>();
        services.AddSingleton<IArtifactBundleValidator, ArtifactBundleValidator>();
        services.AddSingleton<ITechnologyLedgerArtifactLinter, TechnologyLedgerArtifactLinter>();
        services.AddSingleton<IDiagramRenderer, MermaidDiagramRenderer>();
        services.AddSingleton<IDiagramAstFromGraphCompiler, DiagramAstFromGraphCompiler>();
        services.AddSingleton<IMermaidDiagramComplexityAnalyzer, MermaidDiagramComplexityAnalyzer>();
        services.AddSingleton<IMermaidDiagramDeterministicRepairer, MermaidDiagramDeterministicRepairer>();
        services.AddSingleton<IMermaidDiagramStructuralValidator, MermaidDiagramStructuralValidator>();
        services.AddSingleton<IMermaidDiagramSemanticIntegrityGuard, MermaidDiagramSemanticIntegrityGuard>();
        services.AddSingleton<IMermaidDiagramFallbackSetBuilder, MermaidDiagramFallbackSetBuilder>();
        services.AddSingleton<IMermaidDiagramRenderPipeline, MermaidDiagramRenderPipeline>();
        services.AddSingleton<IMermaidDiagramAiRepairer, NoOpMermaidDiagramAiRepairer>();
        services.AddScoped<IArtifactGenerator, ReferenceArchitectureMarkdownGenerator>();
        services.AddScoped<IArtifactGenerator, ArchitectureNarrativeArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, ComplianceMatrixArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, CoverageSummaryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, DiagramAstGenerator>();
        services.AddScoped<IArtifactGenerator, MermaidDiagramArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, InventoryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator>(static sp =>
            new CostSummaryArtifactGenerator(sp.GetRequiredService<IInfrastructureCostArtifactAugmentationProvider>()));
        services.AddSingleton<ArchLucid.Core.Terraform.ITerraformValidator, ArchLucid.ArtifactSynthesis.Validation.CompositeTerraformValidator>();
        services.AddScoped<IArtifactGenerator, TerraformAdvisoryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, UnresolvedIssuesArtifactGenerator>();
        services.AddScoped<IArtifactSynthesisService, ArtifactSynthesisService>();
        services.AddScoped<IDocxExportService, DocxExportService>();
        services.AddSingleton<IValueReportRenderer, DocxValueReportRenderer>();
    }

    /// <summary>Registers outbound Retail probing plus artifact augmentation injected into cost summaries.</summary>
    private static void RegisterInfrastructureCostSizing(IServiceCollection services)
    {
        services.AddSingleton<AzureRetailPricesCatalogClient>(
            static sp =>
                new AzureRetailPricesCatalogClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<AzureRetailPricesCatalogClient>>()));

        services.AddSingleton<AwsPublicPricingClient>(
            static sp =>
                new AwsPublicPricingClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<AwsPublicPricingClient>>()));

        services.AddSingleton<GcpCloudBillingCatalogClient>(
            static sp =>
                new GcpCloudBillingCatalogClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName),
                    sp.GetRequiredService<IOptionsMonitor<GcpBillingCatalogOptions>>(),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<GcpCloudBillingCatalogClient>>()));

        services.AddSingleton<IInfrastructureCostArtifactAugmentationProvider,
            MultiCloudInfrastructureCostArtifactAugmentationProvider>();
    }
}
