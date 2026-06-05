using ArchLucid.Api.Validators;
using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestTemplateValidatorTests
{
    public static TheoryData<Func<string?, ArchitectureRequest>> TemplateFactories =>
    [
        ArchitectureRequestTemplates.MicroservicesWebPlatform,
        ArchitectureRequestTemplates.MonolithMigrationAssessment,
        ArchitectureRequestTemplates.EventDrivenProcessingPipeline,
        ArchitectureRequestTemplates.CloudNativeMigration,
        ArchitectureRequestTemplates.RegulatedHealthcareSystem,
        ArchitectureRequestTemplates.RetailBankingAndPaymentsPlatform,
        ArchitectureRequestTemplates.SmartManufacturingOtItReference
    ];

    [Theory]
    [MemberData(nameof(TemplateFactories))]
    public async Task Each_catalog_template_passes_ArchitectureRequestValidator(Func<string?, ArchitectureRequest> factory)
    {
        ArchitectureRequest request = factory($"tpl-val-{Guid.NewGuid():N}");
        ArchitectureRequestValidator validator = new();

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue(string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
    }
}
