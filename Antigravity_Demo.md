# 🛰️ Antigravity Demo & System Workflow

This document explains the end-to-end trace, execution path, and security guardrail details of the **OmniPilot AI** system.

---

## 🔄 End-to-End Workflow Execution Path

When a user submits a goal through the Web Dashboard or CLI, the system routes execution as follows:

```
[User Request]
      │
      ▼
[Express Server / CLI]
      │
      ▼
[ADK Orchestrator] ───────► (Initializes execution trace logs)
      │
      ▼
[Planner Agent]
      ├── 1. Calls 'system_status' MCP Tool (returns OS details, Node version, memory usage)
      ├── 2. Parses keywords (study, scheduling, optimization) to decide delegate agents
      └── 3. Dispatches task blocks to relevant specialists
      │
      ├───► [Exam/Study Agent]
      │         ├── Formulates syllabus guides (e.g. Biology topics)
      │         └── Calls MCP tool 'write_file' to save 'study_guide_biology.txt'
      │
      ├───► [Life Scheduler Agent]
      │         ├── Formulates 24-hour hour-by-hour calendar routine
      │         ├── Calls MCP tool 'calculator' to evaluate budget sum e.g. "4 + 8 + 2 + 3 + 1"
      │         └── Calls MCP tool 'write_file' to save 'daily_routine.txt'
      │
      └───► [Task Optimization Agent]
                ├── Formulates prioritized weighted backlog lists
                └── Calls MCP tool 'write_file' to store JSON state in 'tasks.json'
      │
      ▼
[Planner Agent] (Consolidates all specialist summaries into single Markdown report)
      │
      ▼
[User Output UI / Console] (Renders final output markdown and visual trace log stack)
```

---

## 🛡️ Demonstrating Security Sandbox Protections

OmniPilot AI implements rigorous local security checks inside `security/sandbox.js`. Here are two key scenarios:

### Scenario A: Prevent Path Traversal
If a compromised or misbehaving agent attempts to read a file outside the designated workspace sandbox using a query (e.g. trying to access System files via `../../Windows/win.ini`):
1. **Tool Invocation**: The agent calls `read_file` with parameter `filename: "../../Windows/win.ini"`.
2. **Security Check**: `tools.js` resolves the target path and invokes `validatePath()`.
3. **Detection**: `validatePath()` detects that the resolved relative path starts with `..` (indicating traversal outside the sandbox).
4. **Action**: The action is BLOCKED. An error is returned with `securityAlert` payload: `Blocked unauthorized path access attempt`.
5. **Dashboard Response**: The Web Dashboard captures the warning, rings a warning indicator, and appends a red warning badge in the **Security Sandbox Log** panel.

### Scenario B: Command Whitelisting
If the Planner or another agent tries to run a command injection (e.g. executing arbitrary commands like `dir; rm -rf /`):
1. **Tool Invocation**: A command execution is requested.
2. **Security Check**: `sandbox.js` parses the command words and matches the primary command word against `COMMAND_WHITELIST = ['echo', 'ver', 'date', 'time', 'whoami']`.
3. **Detection**: Any instruction outside this list (or any character like `;`, `&`, `|`, `<`, `>` indicating injection) fails validation.
4. **Action**: The command is rejected immediately, preventing child process invocation.

---

## 📈 Sample Trace Log Output

Below is an example trace sequence recorded by the orchestrator:

```json
[
  {
    "timestamp": "2026-07-06T13:05:00.123Z",
    "step": "start",
    "agent": "Orchestrator",
    "detail": "Received task: \"Create a biology study plan and daily schedule\""
  },
  {
    "timestamp": "2026-07-06T13:05:00.150Z",
    "step": "dispatch",
    "agent": "Orchestrator",
    "detail": "Delegating input to Planner Agent..."
  },
  {
    "timestamp": "2026-07-06T13:05:00.160Z",
    "step": "analyze",
    "agent": "Planner Agent",
    "detail": "Parsing user input and matching keywords for task delegation."
  },
  {
    "timestamp": "2026-07-06T13:05:00.170Z",
    "step": "tool_call",
    "agent": "Planner Agent",
    "detail": "Calling tool 'system_status' with arguments: {}"
  },
  {
    "timestamp": "2026-07-06T13:05:00.200Z",
    "step": "tool_response",
    "agent": "Planner Agent",
    "detail": "Tool 'system_status' returned: {\"os\":\"Microsoft Windows 11\",\"nodeVersion\":\"v20.10.0\",\"memoryUsageMB\":{\"total\":32,\"used\":18},\"sandboxMode\":\"ACTIVE\"}..."
  },
  {
    "timestamp": "2026-07-06T13:05:00.220Z",
    "step": "dispatch",
    "agent": "Orchestrator",
    "detail": "Routing task to Exam/Study Agent: \"Create structured study plan and quiz items for Biology.\""
  },
  {
    "timestamp": "2026-07-06T13:05:00.250Z",
    "step": "tool_call",
    "agent": "Exam/Study Agent",
    "detail": "Calling tool 'write_file' with arguments: {\"filename\":\"study_guide_biology.txt\",\"content\":\"...\"}"
  },
  {
    "timestamp": "2026-07-06T13:05:00.280Z",
    "step": "tool_response",
    "agent": "Exam/Study Agent",
    "detail": "Tool 'write_file' returned: {\"filename\":\"study_guide_biology.txt\",\"size\":340}..."
  },
  {
    "timestamp": "2026-07-06T13:05:00.320Z",
    "step": "finish",
    "agent": "Orchestrator",
    "detail": "Execution complete. Summary generated."
  }
]
```
