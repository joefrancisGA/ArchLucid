using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Validators;
using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureRequestTemplateValidatorTests
{
    private static readonly JsonSerializerOptions ControllerJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(null) }
    };

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

    [Theory]
    [MemberData(nameof(TemplateFactories))]
    public async Task Each_catalog_template_passes_validator_after_controller_json_round_trip(
        Func<string?, ArchitectureRequest> factory)
    {
        ArchitectureRequest request = factory($"tpl-val-rt-{Guid.NewGuid():N}");
        string json = JsonSerializer.Serialize(request, ControllerJsonOptions);
        ArchitectureRequest? restored = JsonSerializer.Deserialize<ArchitectureRequest>(json, ControllerJsonOptions);
        restored.Should().NotBeNull();

        ArchitectureRequestValidator validator = new();
        ValidationResult result = await validator.ValidateAsync(restored!);

        result.IsValid.Should().BeTrue(string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
    }
}
