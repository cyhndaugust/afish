---
name: afish-quality-gate
description: Verify Afish changes with deterministic frontend, backend, and cross-layer contract checks, then select focused manual regressions for Canvas, realtime, storage, bilingual UI, administration, and deployment behavior. Use after implementation, before handoff or release, when reviewing a diff, or when reproducing and validating a bug in this repository.
---

# Afish Quality Gate

## Establish scope

1. Run from the Afish repository root.
2. Inspect `git status --short` and the relevant diff or changed files. Do not alter unrelated user work.
3. Translate the change into observable assertions before testing. Include the original reproduction for a bug fix.

## Run deterministic checks

Execute:

```bash
.agents/skills/afish-quality-gate/scripts/check.sh
```

The script checks cross-layer constants and event names, compiles backend Python, and runs the production frontend build. Treat any failure as unresolved; diagnose the first actionable failure before rerunning.

If dependencies are missing, report the missing prerequisite instead of installing packages without authorization. Never weaken or skip a failing check merely to obtain a green result.

## Select regressions

Read [references/regression-matrix.md](references/regression-matrix.md). Run the smallest set covering every changed behavior and boundary:

- exercise both success and failure states for changed input or requests;
- use two clients for realtime additions, deletions, or restoration;
- check both languages for changed user-visible copy or layouts;
- check a coarse-pointer/mobile viewport for drawing, hit testing, or responsive changes;
- use a disposable database or test data for destructive administration paths;
- verify Docker or Nginx only when deployment files or production routing changed.

Do not permanently delete real fish data as a test. Do not run `docker compose down -v` unless the user explicitly requests deletion of the volume.

## Report evidence

Report:

1. each command or scenario run and its outcome;
2. the exact assertion established by that check;
3. skipped checks and why they were not applicable or could not run;
4. residual risk, especially for browser animation, touch behavior, concurrency, migration, and production proxy changes.

Use “not run” instead of implying success when a check was not executed.
