# Manual TUI validation

Command:

```sh
./node_modules/.bin/pi --no-session --no-extensions -e ./extensions/index.ts
```

Environment: Herdr workspace `w71`, isolated Pi Atelier checkout, Pi 1.4.0, DeepSeek provider, 120x40 terminal pane. Initial run used pane `w71:p5`; the reload verification used fresh pane `w71:p7`.

Checklist:

- [x] Isolated Atelier session starts and renders the owned footer.
- [x] Submit `Run the bash command \`false\` now.`.
- [x] The `bash` tool returns `Command exited with code 1`.
- [x] The footer remains visibly failed after settlement: `× ERROR` rendered in red.
- [x] Model and telemetry remain visible beside the error state.
- [x] Reload the isolated session after the first run; fresh pane `w71:p7` rendered READY before the failure check.
- [x] Repeat the exact `false` tool failure after reload; the footer again rendered red `× ERROR`.
- [ ] Provider-only error with no tool failure: not run; no deterministic safe trigger was available in this session.

Observed transcript:

```text
$ false

(no output)

Command exited with code 1

Took 0.0s

false eseguito: exit code 1, nessun output.

╭─ × ERROR · deepseek-v4.1-flash · 2.6% ─────────────
│
╰────────────────────────────────────────────────────
  26k  78  100%  $0.004
```

Reloaded session observation (`w71:p7`):

```text
$ false

(no output)

Command exited with code 1

╭─ × ERROR · deepseek-v4.1-flash · 2.6% ─────────────
```
