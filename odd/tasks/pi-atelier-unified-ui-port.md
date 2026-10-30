# Pi Atelier Unified UI port

Feature document for the forked Pi Atelier contribution that makes Atelier the primary UI and ports the smallest compatible Unified UI behavior.
Source repository: `https://github.com/michaelmjhhhh/pi-atelier`; fork: `https://github.com/darkrei08/pi-atelier`.

## Specs

1. **S1** The operator said: "Quello che intendo è che l'estensione con il link che ti ho dato prima deve essere la nostra principale, perché la trovo molto meglio."
2. **S2** The operator said: "Pertanto, tutte le modifiche di mia Unify Duai, se possibile, manda una pull request con le futures più possibilmente richiedibili da inviare appunto a PHI quindi devi creare un fork di piatelli dove ho effetto delle modifiche analizzando gli unify UI rispetto a qualcosa che posso fare una pur request verso di lui, in modo tale che PATLE sia la mia unica interfaccia grafica per PAGENP e per Herder."
3. **S3** The operator asked: "È giusto il ragionamento? O stai sbagliando rispetto al prompt di prima?"
4. **S4** The selected first contribution is a prompt/turn error state in Atelier's existing activity rail: a failed tool or turn must remain visibly failed instead of resetting to ready/green.
5. **S5** The contribution must preserve Atelier ownership of the footer, sidebar, and editor, keep the core package free of a direct `pi-extensible-workflows` dependency, and use existing public/internal Atelier seams.

## Tasks

- T1 (S1-S5): Record the verified port plan and baseline. Route: tracking. Commit: pending.
- T2 (S4-S5): Implement the additive activity error state in `src/types.ts`, `src/run-activity.ts`, `src/footer.ts`, and the relevant extension lifecycle hook. Route: implementation. Commit: pending.
- T3 (S4-S5): Run the package checks and perform manual TUI validation; do not add unit or e2e tests for this TUI change, per `CONTRIBUTING.md`. Route: verification. Commit: pending.
- T4 (S1-S5): Prepare a focused fork commit and open a pull request from `darkrei08/pi-atelier` to `michaelmjhhhh/pi-atelier`. Route: delivery. Commit: pending.

## Log

- L1: "Quello che intendo è che l'estensione con il link che ti ho dato prima deve essere la nostra principale, perché la trovo molto meglio. Pertanto, tutte le modifiche di mia Unify Duai, se possibile, manda una pull request con le futures più possibilmente richiedibili da inviare appunto a PHI quindi devi creare un fork di piatelli dove ho effetto delle modifiche analizzando gli unify UI rispetto a qualcosa che posso fare una pur request verso di lui, in modo tale che PATLE sia la mia unica interfaccia grafica per PAGENP e per Herder. È giusto il ragionamento? O stai sbagliando rispetto al prompt di prima?"
- L2: Workflow plan `b223254e-407d-441a-af5b-088f590b90d7` selected the narrow prompt-error-state slice and rejected direct workflow dependencies and persistent above-editor widgets as first upstream contributions.
- L3: `CONTRIBUTING.md` states: "For TUI changes (sidebar, footer, menus, or overlays), **do not add unit or e2e tests**. Run existing checks and provide a manual TODO checklist, observed results, and a screenshot/recording or attached artifact." Therefore verification uses existing checks plus manual TUI validation.
- L4: Manual validation in `odd/pi-atelier-unified-ui-port/manual-validation.md` confirmed a failed `false` tool leaves the isolated Atelier footer in red `× ERROR` state with model and telemetry visible. Provider-only error validation was not run because no deterministic safe trigger was available.
- L5: After restarting the isolated session in fresh Herdr pane `w71:p7`, the footer rendered READY, then the exact `false` tool failure reproduced the red `× ERROR` state.
