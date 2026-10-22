namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>
///     One demo seed scenario (or a load-bearing step group within a scenario). Step names align with
///     <see cref="DemoSeedScenarioRegistry"/> <c>StepName</c> values.
/// </summary>
public interface IDemoSeedScenarioSeeder
{
    /// <summary>Registry step names owned by this seeder (executed in registry order).</summary>
    IReadOnlyCollection<string> StepNames { get; }

    /// <summary>Idempotent seed for the given registry step.</summary>
    Task SeedStepAsync(string stepName, CancellationToken cancellationToken);
}
