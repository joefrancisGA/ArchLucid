# FND-010 comparison/export combined validation — 2026-11-24

Integration-only candidate. All three inputs share base 7bd4b13dc74831ee446efe530ced569c60247050; the only overlapping file is the FND-010 authorization workflow selector. Its union now contains 27 distinct class filters. Production and test code is unchanged from the independently validated input heads.

| PR | Exact head | Focused CI |
| --- | --- | --- |
| #8026 | eb8c9e4384ef773def97343ed2e4656ab3fd753e | [45448184151](https://github.com/joefrancisGA/ArchLucid/actions/runs/45448184151) success |
| #8028 | 6de9e647b65e66c43b93d25b899818ca89d6dac4 | [45448915163](https://github.com/joefrancisGA/ArchLucid/actions/runs/45448915163) success |
| #8030 | 9f3afd2d8e4e8423b0a4fcaa09eb5b818fc987db | [45453940382](https://github.com/joefrancisGA/ArchLucid/actions/runs/45453940382) success |

All three input heads are in this candidate's ancestry. Combined focused CI remains required. This is an alternative integration path, not another control implementation; do not merge the candidate and all originals indiscriminately. Owner retains merge decisions. Retrieval PR #8035 is independent and uses its own targeted workflow. No comprehensive master build dispatched.
