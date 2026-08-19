using FluentAssertions;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
public sealed class ArgumentExtensionsTests
{
    [Fact]
    public void ThrowIfNull_WhenArgumentIsNotNull_ReturnsArgument()
    {
        object value = new();

        object result = value.ThrowIfNull();

        result.Should().BeSameAs(value);
    }

    [Fact]
    public void ThrowIfNull_WhenArgumentIsNull_ThrowsArgumentNullException()
    {
        object? value = null;

        Action act = () => value.ThrowIfNull();

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ThrowIfNull_WhenArgumentIsNull_ExceptionMessageContainsParameterName()
    {
        // CallerArgumentExpression captures the source expression at the call site ("value"),
        // so the ArgumentNullException names the parameter without an explicit nameof.
        object? value = null;

        Action act = () => value.ThrowIfNull();

        act.Should()
           .Throw<ArgumentNullException>()
           .WithParameterName("value");
    }

    [Fact]
    public void ThrowIfNull_WorksWithInterfaceType()
    {
        IDisposable disposable = new FakeDisposable();

        IDisposable result = disposable.ThrowIfNull();

        result.Should().BeSameAs(disposable);
    }

    [Fact]
    public void ThrowIfNull_WorksWithStringType()
    {
        const string value = "hello";

        string result = value.ThrowIfNull();

        result.Should().Be("hello");
    }

    [Fact]
    public void ThrowIfNull_UsableAsFieldInitializerSurrogate()
    {
        // Verifies the typical primary-constructor usage pattern compiles and executes correctly.
        Action act = () => _ = new ServiceUnderTest(null!);

        act.Should()
           .Throw<ArgumentNullException>()
           .WithParameterName("dependency");
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private sealed class FakeDisposable : IDisposable
    {
        public void Dispose()
        {
        }
    }

    private sealed class ServiceUnderTest(IDisposable dependency)
    {
        // Typical field-initializer usage: stores the validated value in the field.
        // Methods then reference _dependency (not the raw primary constructor param).
        private readonly IDisposable _dependency = dependency.ThrowIfNull();

        public void Use() => _dependency.Dispose();
    }
}
