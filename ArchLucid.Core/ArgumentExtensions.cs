using System.Runtime.CompilerServices;

namespace ArchLucid.Core;

/// <summary>
///     Fluent guard helpers for constructor argument validation.
/// </summary>
/// <remarks>
///     <para><b>When to use <see cref="ThrowIfNull{T}"/> vs BCL <see cref="ArgumentNullException.ThrowIfNull(object?, string?)"/>.</b></para>
///     <list type="bullet">
///         <item>
///             <description>
///                 Primary-constructor <c>private readonly</c> field initializer — prefer
///                 <c>_x = x.ThrowIfNull()</c> (needs a non-null value in the expression).
///             </description>
///         </item>
///         <item>
///             <description>
///                 First line of an instance method for a parameter — BCL
///                 <see cref="ArgumentNullException.ThrowIfNull(object?, string?)"/> is preferred; do not churn
///                 existing BCL call sites for style only.
///             </description>
///         </item>
///         <item>
///             <description>
///                 <c>x ?? throw new ArgumentNullException(nameof(x))</c> inside a larger expression where
///                 you need <c>x</c> — use <c>x.ThrowIfNull()</c>.
///             </description>
///         </item>
///         <item>
///             <description>
///                 <c>IOptions&lt;T&gt;?.Value</c> or other shapes that are not “guard this reference” — keep
///                 explicit code or BCL; this extension is <c>where T : class</c> on the guarded reference only.
///             </description>
///         </item>
        ///         <item>
///             <description>
///                 Contract/DTO assemblies (for example those that do not reference <c>ArchLucid.Core</c>) —
///                 do not use this helper there unless adding that reference is intentional.
///             </description>
///         </item>
///     </list>
///     <para>
///         <b>Primary-constructor footgun:</b> if you store <c>_x = x.ThrowIfNull()</c>, instance methods must use
///         <c>_x</c>, not the constructor parameter <c>x</c>, or analyzers will treat <c>_x</c> as unused.
///     </para>
/// </remarks>
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
    ///     <para>Team policy for BCL vs this helper is documented on <see cref="ArgumentExtensions"/>.</para>
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
