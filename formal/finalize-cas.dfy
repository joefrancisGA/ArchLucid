module FinalizeCas {
  datatype PackageState = Unsealed | Sealed

  datatype Model = Model(
    package: PackageState,
    leaseHeld: bool,
    finalizeCount: int
  )

  predicate Valid(m: Model) {
    m.finalizeCount <= 1 &&
    (m.package == Sealed ==> m.finalizeCount == 1) &&
    (m.package == Sealed ==> !m.leaseHeld)
  }

  function Finalize(m: Model): Model {
    if m.package == Sealed || m.finalizeCount >= 1 {
      m
    } else {
      Model(Sealed, false, m.finalizeCount + 1)
    }
  }
}
