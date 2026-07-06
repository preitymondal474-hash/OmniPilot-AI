import express from 'express';
import cors from 'cors';
import path from 'url';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import orchestrator from './agents/index.js';
import mcpServer from './mcp/mcp-server.js';
import { validatePath } from './security/sandbox.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const SANDBOX_DIR = dirname(__filename) + '/sandbox';

app.use(cors());
app.use(express.json());
app.use(express.static(dirname(__filename) + '/public'));

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

// 1. Get system & validation status
app.get('/api/status', (req, res) => {
  res.json({
    server: 'ONLINE',
    sandboxMode: 'ACTIVE',
    mcpServer: 'READY',
    sandboxPath: SANDBOX_DIR
  });
});

// 2. List MCP tools
app.get('/api/mcp/tools', (req, res) => {
  try {
    const list = mcpServer.listTools();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Call MCP tool directly (for testing/diagnostics on UI)
app.post('/api/mcp/call', async (req, res) => {
  const { toolName, arguments: args } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: 'Missing toolName parameter.' });
  }
  try {
    const result = await mcpServer.callTool(toolName, args || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Run Multi-Agent Orchestrator
app.post('/api/agents/run', async (req, res) => {
  const { task } = req.body;
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid task parameter.' });
  }
  try {
    const response = await orchestrator.runTask(task);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get current task list database state
app.get('/api/tasks', (req, res) => {
  const dbPath = SANDBOX_DIR + '/tasks.json';
  if (!fs.existsSync(dbPath)) {
    return res.json([]);
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    res.json(JSON.parse(raw));
  } catch (error) {
    res.status(500).json({ error: 'Error reading tasks database: ' + error.message });
  }
});

// 6. Get created files list inside sandbox
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(SANDBOX_DIR);
    const fileList = files.map(file => {
      const stats = fs.statSync(SANDBOX_DIR + '/' + file);
      return {
        name: file,
        size: stats.size,
        updatedAt: stats.mtime
      };
    });
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get content of a specific file inside sandbox
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const targetPath = dirname(__filename) + '/sandbox/' + filename;

  if (!validatePath(targetPath, SANDBOX_DIR)) {
    return res.status(403).json({ error: 'Forbidden: Path traversal blocked.' });
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: `File not found: ${filename}` });
  }

  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 OmniPilot AI Backend server listening on http://localhost:${PORT}`);
  console.log(`🛡️  Security Sandbox Active path: ${SANDBOX_DIR}`);
});
