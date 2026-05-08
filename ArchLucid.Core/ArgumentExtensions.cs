using System.Runtime.CompilerServices;

namespace ArchLucid.Core;

/// <summary>
///     Fluent guard helpers for constructor argument validation.
/// </summary>
public static class ArgumentExtensions
{
    /// <summary>
    ///     Returns <paramref name="argument"/> unchanged, or throws <see cref="ArgumentNullException"/>
    ///     when <paramref name="argument"/> is <see langword="null"/>.
    /// </summary>
    /// <remarks>
    ///     <para>
    ///         Designed for use in primary-constructor field initializers so that the validated
    ///         value flows through to the stored field:
    ///     </para>
    ///     <code>
    ///         private readonly IFoo _foo = foo.ThrowIfNull();
    ///     </code>
    ///     <para>
    ///         <see cref="CallerArgumentExpressionAttribute"/> captures the source expression
    ///         (e.g. <c>"foo"</c>) automatically, so the <see cref="ArgumentNullException"/>
    ///         message names the offending parameter without any extra <c>nameof</c> call.
    ///     </para>
    /// </remarks>
    /// <typeparam name="T">Any reference type.</typeparam>
    /// <param name="argument">The value to guard.</param>
    /// <param name="paramName">
    ///     Filled by the compiler from the call-site expression; do not pass explicitly.
    /// </param>
    /// <returns><paramref name="argument"/> when it is not <see langword="null"/>.</returns>
    /// <exception cref="ArgumentNullException">
    ///     Thrown when <paramref name="argument"/> is <see langword="null"/>.
    /// </exception>
    public static T ThrowIfNull<T>(
        this T? argument,
        [CallerArgumentExpression(nameof(argument))] string? paramName = null)
        where T : class
        => argument ?? throw new ArgumentNullException(paramName);
}
