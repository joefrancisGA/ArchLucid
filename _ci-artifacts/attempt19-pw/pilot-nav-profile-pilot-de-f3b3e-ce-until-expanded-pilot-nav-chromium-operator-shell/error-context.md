# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - main [ref=e3]:
    - alert [ref=e4]:
      - strong [ref=e5]: Something went wrong
      - paragraph [ref=e6]: This page hit an unexpected error. You can try again, go home, or open Help for guidance.
    - generic [ref=e7]:
      - button "Retry" [ref=e8] [cursor=pointer]
      - link "Home" [ref=e9] [cursor=pointer]:
        - /url: /
      - link "Help" [ref=e10] [cursor=pointer]:
        - /url: /help
```