namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     One idempotent unit of demo seeding, named so a partial seed can be traced to the step that failed.
/// </summary>
/// <param name="Name">Stable step key used in seed diagnostics (not user-facing copy).</param>
/// <param name="ExecuteAsync">Runs the step; must be safe to re-run against an already-seeded workspace.</param>
internal sealed record DemoSeedStep(string Name, Func<CancellationToken, Task> ExecuteAsync);
