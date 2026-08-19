namespace ArchLucid.Core;

/// <summary>
///     UTC helpers for <see cref="TimeProvider" /> so call sites do not repeat
///     <c>GetUtcNow().UtcDateTime</c> or <c>DateOnly.FromDateTime(...)</c>.
/// </summary>
public static class TimeProviderExtensions
{
    extension(TimeProvider provider)
    {
        /// <summary>Returns <see cref="DateTimeKind.Utc" /> <see cref="DateTime" /> for the provider clock.</summary>
        /// <remarks>Keep using <see cref="TimeProvider.GetUtcNow" /> here; do not call this extension from inside itself.</remarks>
        public DateTime UtcNowDateTime()
        {
            return provider is null ? throw new ArgumentNullException(nameof(provider)) : provider.GetUtcNow().UtcDateTime;
        }
    }

    /// <summary>UTC calendar date for the provider clock.</summary>
    public static DateOnly UtcToday(this TimeProvider provider)
    {
        return provider is null ? throw new ArgumentNullException(nameof(provider)) : DateOnly.FromDateTime(provider.GetUtcNow().UtcDateTime);
    }
}
