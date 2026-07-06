# 🛰️ OmniPilot AI

A secure, local-first multi-agent AI workspace built with Node.js that demonstrates Model Context Protocol (MCP) architecture and Agent Development Kit (ADK) orchestration. The project runs entirely offline with rule-based agents—no external APIs or API keys required.

## ✨ Features

- 🤖 Multi-agent orchestration (Planner, Study, Scheduler, Optimizer)
- 🔌 Mock MCP server with tool routing
- 🔒 Sandboxed file operations and security guardrails
- 🧮 Built-in calculator and diagnostics
- 🌐 Interactive web dashboard
- 💻 Command-line interface (CLI)

## 🛠️ Tech Stack

- Node.js
- Express.js
- JavaScript (ES6)
- HTML, CSS, JavaScript
- MCP (Mock Implementation)
- ADK Design Pattern

## 📁 Project Structure

```text
.
├── agents/
├── mcp/
├── security/
├── sandbox/
├── public/
├── server.js
├── cli.js
├── package.json
└── README.md
```

## 🏗️ Project Architecture

```text
                           +----------------------+
                           |      User (Web/CLI)  |
                           +----------+-----------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
          +---------v---------+               +---------v---------+
          |  Web Dashboard    |               |    CLI Client     |
          | (HTML/CSS/JS)     |               |     (cli.js)      |
          +---------+---------+               +---------+---------+
                    |                                   |
                    +-----------------+-----------------+
                                      |
                           +----------v-----------+
                           |   Express Server     |
                           |     (server.js)      |
                           +----------+-----------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
          +---------v---------+               +---------v---------+
          |    ADK Engine     |               |   MCP Server      |
          | (Orchestrator)    |               | (Tool Router)     |
          +---------+---------+               +---------+---------+
                    |                                   |
      +-------------+-------------+                     |
      |             |             |                     |
+-----v----+ +------v-----+ +-----v------+ +-----------v-----------+
| Planner  | | Study Agent| | Scheduler  | | Task Optimizer Agent  |
|  Agent   | |             | |   Agent    | |                       |
+-----+----+ +------+-----+ +------+-----+ +-----------+-----------+
      |             |              |                    |
      +-------------+--------------+--------------------+
                                    |
                         +----------v-----------+
                         |    MCP Tools Layer   |
                         +----------+-----------+
                                    |
          +------------+------------+------------+-------------+
          |            |            |            |             |
   +------v-----+ +----v-----+ +----v-----+ +----v------+ +----v------+
   | Read File  | |Write File| |Calculator| |System Info| |Task Search|
   +------+-----+ +----+-----+ +----+-----+ +----+------+ +----+------+
          |            |            |            |             |
          +------------+------------+------------+-------------+
                                    |
                         +----------v-----------+
                         | Security Sandbox     |
                         | • Path Validation    |
                         | • Input Sanitization |
                         | • Command Whitelist  |
                         +----------+-----------+
                                    |
                     +--------------+---------------+
                     |                              |
            +--------v--------+            +--------v--------+
            |  sandbox/       |            |   tasks.json    |
            | Secure Files    |            | Task Database   |
            +-----------------+            +-----------------+
...

## 🚀 Installation

```bash
git clone <repository-url>
cd OmniPilot-AI
npm install
```

## ▶️ Run the Project

Start the web application:

```bash
npm start
```

Open: http://localhost:3000

Run the CLI:

```bash
npm run cli
```

## 📖 Overview

OmniPilot AI is a secure, local-first multi-agent system that demonstrates the integration of the Agent Development Kit (ADK) and the Model Context Protocol (MCP). It provides an interactive web dashboard and CLI for task planning, study management, scheduling, and task optimization while ensuring secure file operations through a sandboxed environment. The project runs entirely offline without requiring external APIs or cloud services.

<img width="1920" height="903" alt="Image" src="https://github.com/user-attachments/assets/09345303-109b-448e-b103-0eccf9f94356" />

## 🔐 Security

- Sandboxed file access
- Path traversal protection
- Input sanitization
- Command whitelist
- Safe expression evaluation

## 📌 Future Improvements

- Real AI model integration
- Database support
- Authentication
- Docker deployment
- Unit & integration tests

## 📄 License

This project is created for educational and academic purposes.
