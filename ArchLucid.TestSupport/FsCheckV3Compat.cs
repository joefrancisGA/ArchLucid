using FsCheck;
using FsCheck.Fluent;

namespace ArchLucid.TestSupport.FsCheckCompat;

/// <summary>FsCheck 2.x <c>Arb</c> / <c>Arb.Default</c> shim for property tests on FsCheck 3.x.</summary>
public static class DefaultArbFacade
{
    public static DefaultArbitraries Default { get; } = new();

    public static Arbitrary<T> From<T>(Gen<T> gen) => global::FsCheck.Fluent.Arb.From(gen);

    public sealed class DefaultArbitraries
    {
        public Arbitrary<int> Int32() => ArbMap.Default.ArbFor<int>();

        public Arbitrary<float> Float() => ArbMap.Default.ArbFor<float>();

        public Arbitrary<bool> Bool() => ArbMap.Default.ArbFor<bool>();

        public Arbitrary<Guid> Guid() => ArbMap.Default.ArbFor<Guid>();

        public Arbitrary<string> String() => ArbMap.Default.ArbFor<string>();

        public Arbitrary<DateTime> DateTime() => ArbMap.Default.ArbFor<DateTime>();

        public Arbitrary<NonEmptyString> NonEmptyString() => ArbMap.Default.ArbFor<NonEmptyString>();

        public Arbitrary<T[]> Array<T>() => ArbMap.Default.ArbFor<T[]>();
    }
}
