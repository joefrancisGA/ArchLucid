# Prometheus rule tests

Before deploying rule changes:

```bash
promtool check rules ../archiforge-slo-rules.yml
promtool check rules ../archiforge-alerts.yml
```

Optional: add `promtool test rules <file>.yaml` cases here when you want time-series regression coverage for burn-rate math; keep inputs aligned with `evaluation_interval` and `for:` durations on alerts.
