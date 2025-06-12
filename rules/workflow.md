# Agent Development Workflow (Claude Code + Cursor)

> **Purpose**  Repeatable, *research‑first* workflow for autonomous coding sessions run with Claude Code CLI or Cursor Agent Mode.
> Reference from `CLAUDE.md` and `.cursor/rules`.

> **⚠️ CRITICAL: NO FEATURE/ISSUE IS COMPLETE WITHOUT ALL 7 WORKFLOW STAGES (2.1-2.7)**

---

## 0 Key Ideas at a Glance
* **Adaptive Research Depth** – Self‑score familiarity; if unfamiliar, run a time‑boxed *spike* / PoC first.
* **Loop‑Closing Tests** – Design tests that the agent can re‑run until behaviour matches spec (unit, visual, E2E).
* **TDD Iteration** – RED → GREEN → REFACTOR ensures incremental correctness.
* **Persistent Knowledge** – Decisions go into GitHub Issues, docs & rules; future agents inherit context.
* **Human Gates** – Stop after research plan & after validation for explicit user approval.

---

## 1 Core Principles
1. **Research before Implementation** – Never code blind.
2. **Tests define Success** – Implementation is *done* only when tests & user checks pass.
3. **Document Once, Reuse Everywhere**.
4. **Ask for Confirmation at Checkpoints**.
5. **Isolate Work with Git Flow**.
6. **Scale Compute** – *think hard* → *harder* → *ultrahard*.

---

## 1.1 Workflow Summary
1. **2.1 Session Boot** - Branch & setup session log
2. **2.2 Research + Planning** - Research, plan, design tests → **IMPORTANT!!! STOP - Get User Approval**  
3. **2.3 Test Design** - Create loop-closing tests
4. **2.4 Implementation** - TDD iteration (RED → GREEN → REFACTOR)
5. **2.5 Validation** - Run CI, QA tests, present evidence → **IMPORTANT!!! STOP - Get User Approval**
6. **2.6 Documentation & PR** - Create issue, commit, open PR
7. **2.7 Close Session** - Update plan, archive session

---

## 2 Session Lifecycle

### 2.1 Session Boot
```bash
# Pick next task
git checkout develop && git pull
open tasks/implementation_plan.md
# Sync & branch
git checkout -b feature/issue-<n>-<slug> && git push -u origin HEAD
# Start log
touch tasks/working_session.md
```

### 2.2 Research + Planning  (Gate 1)
| Step | Action |
|------|--------|
| **Familiarity Check** | Rate confidence 1‑100. <70 → mark as *unfamiliar*. |
| **If Unfamiliar → Spike/PoC** | Create a *time‑boxed* PoC (“spike”) to de‑risk unknown APIs/tech . Record findings in session log. |
| **Version‑Locked Docs** | Retrieve docs for the exact dependency versions listed in manifests . |
| **Common LLM Mistakes & Mitigations** | • Hallucinating methods → verify by running PoC . • Out‑of‑date API usage → cross‑check multiple sources. |
| **Architecture Sketch** | List impacted files, data flows, side‑effects; note integration points. |
| **Test Blueprint** | Design *loop‑closing* tests (see §2.3). |
| **User Approval** | Present plan + risks + test list; wait for explicit **OK**. |

### 2.3 Test Design — Closing the Loop
> *“Tests are the feedback channel that lets the agent iterate safely”*.

| Target | Test Type | Loop Mechanism | Tooling Example |
|--------|-----------|---------------|-----------------|
| **Algorithms / Logic** | Unit tests | Assert I/O → iterate until green | `pytest` / `unittest` |
| **UI / Styling** | Visual regression | Screenshot diff until pixels match  | Puppeteer + Jest‑Image‑Snapshot |
| **APIs / Services** | Integration tests hitting *real* endpoints  | Re‑run after each code change | `pytest‑httpx`, Postman CLI |
| **Device Features (e.g., Voice)** | E2E user tests on physical/virtual device | Manual or scripted runs until UX passes | Android/iOS simulators, HomePods |

**Design Guidance**
*Write failing tests before code; ensure each verifies externally observable behaviour, not implementation details .*

### 2.4 Implementation — Iterative TDD Loop
```text
RED  → write failing test(s)
GREEN → minimal code to pass current test
REFACTOR → clean & optimise with tests green
repeat ↻
```
* Commit small increments (`feat: pass login happy‑path (#12)`).
* For unfamiliar APIs, start inside the PoC branch, then port learnings.
* Run full suite frequently; treat any regression as a stop‑ship bug.

### 2.5 Validation  (Gate 2)
1. Run **complete** CI suite & linters.
2. Execute manual QA script from `working_session.md`.
3. Present evidence to the user that the feature works correctly (test logs, screenshots, demo) → wait for user sign‑off.

### 2.6 Documentation & Pull Request
1. **Create GitHub Issue & Capture Number**
   ```bash
   # Create issue and extract the issue number
   ISSUE_URL=$(gh issue create -t "Feature: <title>" -b "$(cat tasks/issue<n>.md)" --label enhancement)
   ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')
   echo "Created GitHub Issue #$ISSUE_NUMBER"
   ```
2. **Prepare Commit Message & Push**
   ```bash
   git add .
   # Use the actual GitHub issue number in commit message
   git commit -m "feat: <description> (closes #$ISSUE_NUMBER)"
   git push
   ```
3. **Open Pull Request**
   ```bash
   # Reference the actual GitHub issue number
   gh pr create --base develop --head feature/issue-<n>-<slug> -t "Feature: <title>" -b "Closes #$ISSUE_NUMBER"
   ```
4. Link CI status & screenshots; wait for review.

**Important Notes:**
- Always use the actual GitHub issue number (not internal task number) in commits and PRs
- The commit message with "closes #<number>" will automatically close the issue when merged
- Extract and use the issue number from the GitHub API response

### 2.7 Close Session
* Check off task in `implementation_plan.md`.
* Archive `working_session.md` into the issue file.
* Update diagrams/docs touched during work.

---

## 3 Definition of Done
- ✅ All tests pass & no regressions.
- ✅ Manual QA approved by user.
- ✅ Docs & issue updated.
- ✅ PR open with reviewers.

---

## 4 Anti‑Patterns
| ❌ Avoid | Because |
|---------|---------|
| Coding before research | Highest hallucination risk  |
| Mocks replacing critical integrations | Masks real‑world failures  |
| Changing tests to pass | Undermines TDD fundamentals  |

---

## 5 Git Flow Reference
```text
main ── production
  ╰─ develop ── integration
       ╰─ feature/issue‑N‑slug  ← you are here
```

---

## 6 File Roles
| File/Dir | Purpose |
|----------|---------|
| `CLAUDE.md` | Commands, version locks, quirks |
| `.cursor/rules/*.mdc` | Reusable scoped rules (≤ 500 lines)  |
| `tasks/implementation_plan.md` | Backlog of tasks |
| `tasks/issue<n>.md` | Issue‑centric knowledge base |
| `docs/architecture.md` | System design |
| `docs/` | Guides & diagrams |
| `tasks/working_session.md` | Scratchpad for current session |

---

## 7 Emergency Protocol
Document blocker → ask user → research alt paths → do **not** guess.

---

_Last updated: 2025‑06‑12_