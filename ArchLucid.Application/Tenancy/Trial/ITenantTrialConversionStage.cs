namespace ArchLucid.Application.Tenancy.Trial;

public interface ITenantTrialConversionStage
{
    Task<TenantTrialConvertResult> ConvertTrialAsync(
        TenantTrialConvertBody? body,
        string actor,
        CancellationToken cancellationToken);
}
