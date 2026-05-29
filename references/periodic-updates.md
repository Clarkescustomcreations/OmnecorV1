# Periodic Updates — Reference

Scope: Any recurring or scheduled work for this site (digests, refreshes, cleanups, end-user-defined schedules, periodic notifications).

Forbidden: `setInterval`, `node-cron`, or any in-process timer. Cloud Run terminates idle instances; in-process timers will not survive.

---

## 1. Cron Types

- **Heartbeat (HTTP cron):** Platform POSTs directly to `/api/scheduled/*` on this site.
- **AGENT cron:** Platform spawns a fresh, isolated Manus session that runs the prompt you wrote.

Decision: Use AGENT cron only if the trigger genuinely needs **agentic capabilities** (web browsing, shell, multi-step planning). One-shot LLM completions belong inline in a Heartbeat handler.

## 2. Facts

1. Callback path **MUST** start with `/api/scheduled/`.
2. Add a `schedule_cron_task_uid varchar(65)` column to business rows. **Update / delete / look up the business row by `task_uid`**.
3. Site **must be deployed** before scheduling — bizserver POSTs production URL, dev sandboxes are unreachable.
4. Wrap handler logic in try/catch and JSON-encode the error on 500.
5. Cron is **6-field** (with seconds): `sec min hour dom mon dow`, UTC, min interval 60s.
6. Handlers must be **idempotent**.
7. Handler timeout is 2 minutes per call.
