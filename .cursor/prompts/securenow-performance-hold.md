# SN-PERF-HOLD — SecureNow performance stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-PERF prompts:

- A new Home route, snapshot route, or diff route. SN-PERF-01 keeps the factory summary JSON and the existing list calls.
- A change to the four Home sentences, the checks-failed suffix, or the Checks failed link.
- A smaller snapshot page on Home. The environment line counts subscriptions on the first page of 20.
- Eight parallel SQL connections for snapshot detail. SN-PERF-02 is one `QueryMultiple` on one connection.
- Sharing `SecureNowAnalysisSnapshot` lists with code that mutates them.
- Higher `MaxPaths`, `MaxDepth`, or `MaxFanOutPerNode`.
- Running privilege, reachability, and toxic combination in parallel. Toxic combination reads the paths the first two persist.
- Deleting the legacy suffix match without the two fixture cases in SN-PERF-04.
- A neighborhood SQL filter inside SN-PERF-05. That prompt only changes the in-memory pair loop.
- Loading properties, tags, or relationships to build unchanged drift rows. **SN-PERF-11** is resources only.
- Changing `RemediationFactoryMetrics` JSON fields or rounding in **SN-PERF-13**.
- Rewriting hypothesis rules in **SN-PERF-14**.
- Splitting canonical snapshot detail back into two round trips in **SN-PERF-16**.
- Changing evidence-hub JSON fields or dropping the child-scope role-assignment match in **SN-PERF-20**.
- Changing how the hub picks the prior snapshot or the diff summary in **SN-PERF-21**.
- Changing preflight blocker text, or switching verification off full snapshot detail, in **SN-PERF-22**.
- Turning a sealed-manifest throw into a skip in **SN-PERF-23** or **SN-PERF-24**.
- A new finding engine, a numeric confidence percent, or a change to rank weights.
- First Load JS work from **PP-01–PP-03**.
- Hiding a review workspace tab behind More.
- A second API host, a catalog split, or `terraform apply`.
- GTM **M-90**, **M-44**, **M-91**, **M-92**.
- Reopening **TB-135** or **TB-136**.

If the session is about to do one of these, stop and report which line it hit.
