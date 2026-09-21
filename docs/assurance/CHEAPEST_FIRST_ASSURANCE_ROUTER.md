# Cheapest-first assurance router

Run the cheapest high-signal checks before expensive model/human review.

Default order:

1. compile/static constraints;
2. targeted unit tests;
3. property/metamorphic tests;
4. semantic golden/synthetic worlds;
5. independent reference oracle;
6. mutation testing for critical kernels;
7. cross-surface and determinism audit;
8. independent AI review;
9. held-out human review.

`scripts/assurance/assurance_router.py` selects the relevant lanes from changed paths and risk tags. It is advisory routing, not a replacement for mandatory repository CI.

High-risk truth-kernel, tenant-isolation and authorization changes escalate to reference-oracle and mutation lanes. Public/expert comparison claims escalate to held-out human evidence.
