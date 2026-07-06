document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const indBackend = document.getElementById('ind-backend');
  const indMcp = document.getElementById('ind-mcp');
  const indSandbox = document.getElementById('ind-sandbox');
  
  const agentInputPrompt = document.getElementById('agent-input-prompt');
  const btnRunAgent = document.getElementById('btn-run-agent');
  const runningSpinner = document.getElementById('running-spinner');
  
  const nodePlanner = document.getElementById('node-planner');
  const nodeStudy = document.getElementById('node-study');
  const nodeOptimizer = document.getElementById('node-optimizer');
  const nodeScheduler = document.getElementById('node-scheduler');
  
  const traceLogsBox = document.getElementById('trace-logs-box');
  const reportOutputBox = document.getElementById('report-output-box');
  
  const mcpToolsList = document.getElementById('mcp-tools-list');
  const diagToolSelect = document.getElementById('diag-tool-select');
  const groupDiagArg = document.getElementById('group-diag-arg');
  const diagToolArgs = document.getElementById('diag-tool-args');
  const btnRunDiagnostic = document.getElementById('btn-run-diagnostic');
  const diagOutputBox = document.getElementById('diag-output-box');
  
  const securityAlertsBox = document.getElementById('security-alerts-box');
  const taskDatabaseRows = document.getElementById('task-database-rows');
  const sandboxFileList = document.getElementById('sandbox-file-list');
  
  const filePreviewPanel = document.getElementById('file-preview-panel');
  const previewFilename = document.getElementById('preview-filename');
  const btnClosePreview = document.getElementById('btn-close-preview');
  const previewContentBox = document.getElementById('preview-content-box');

  const API_BASE = window.location.origin;

  // Initialize
  checkSystemStatus();
  fetchMcpTools();
  fetchTasks();
  fetchSandboxFiles();

  // Show/Hide arguments for diagnostic tools
  diagToolSelect.addEventListener('change', () => {
    const tool = diagToolSelect.value;
    if (tool === 'calculator' || tool === 'search_tasks') {
      groupDiagArg.classList.remove('hidden');
      diagToolArgs.value = tool === 'calculator' 
        ? '{"expression": "4 * (5 + 3)"}' 
        : '{"query": "study"}';
    } else {
      groupDiagArg.classList.add('hidden');
      diagToolArgs.value = '';
    }
  });

  // Execute Agent Pipeline
  btnRunAgent.addEventListener('click', runAgentPipeline);
  agentInputPrompt.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') runAgentPipeline();
  });

  // Execute Diagnostic Tool
  btnRunDiagnostic.addEventListener('click', runDiagnostic);

  // Close File Preview
  btnClosePreview.addEventListener('click', () => {
    filePreviewPanel.classList.add('hidden');
  });

  // --- Functions ---

  async function checkSystemStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        updateIndicator(indBackend, true, `Server: ${data.server}`);
        updateIndicator(indMcp, true, `MCP: ${data.mcpServer}`);
        updateIndicator(indSandbox, true, `Sandbox: ${data.sandboxMode}`);
      } else {
        throw new Error();
      }
    } catch {
      updateIndicator(indBackend, false, 'Server: OFFLINE', 'red');
      updateIndicator(indMcp, false, 'MCP: DISCONNECTED', 'red');
      updateIndicator(indSandbox, false, 'Sandbox: INACTIVE', 'red');
    }
  }

  function updateIndicator(el, success, text, color = 'green') {
    const dot = el.querySelector('.status-dot');
    const label = el.querySelector('.ind-label');
    label.textContent = text;
    dot.className = `status-dot ${success ? color : 'red'}`;
  }

  async function fetchMcpTools() {
    try {
      const res = await fetch(`${API_BASE}/api/mcp/tools`);
      if (res.ok) {
        const data = await res.json();
        mcpToolsList.innerHTML = '';
        data.tools.forEach(tool => {
          const card = document.createElement('div');
          card.className = 'tool-card';
          card.innerHTML = `
            <div class="tool-card-head">
              <span class="tool-name">${tool.name}</span>
              <span class="file-meta">MCP Tool</span>
            </div>
            <div class="tool-desc">${tool.description}</div>
          `;
          mcpToolsList.appendChild(card);
        });
      }
    } catch (err) {
      mcpToolsList.innerHTML = `<div class="db-empty">Failed to load tools: ${err.message}</div>`;
    }
  }

  async function fetchTasks() {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      if (res.ok) {
        const tasks = await res.json();
        if (tasks.length === 0) {
          taskDatabaseRows.innerHTML = '<div class="db-empty">No tasks tracked in tasks.json. Run agents to generate.</div>';
          return;
        }
        taskDatabaseRows.innerHTML = '';
        tasks.forEach(task => {
          const row = document.createElement('div');
          row.className = 'task-row';
          row.innerHTML = `
            <span class="task-id">${task.id}</span>
            <span class="task-title">${task.title}</span>
            <span class="task-assignee">${task.agent}</span>
            <span class="task-priority ${task.priority}">${task.priority}</span>
            <span class="task-status ${task.status}">${task.status}</span>
          `;
          taskDatabaseRows.appendChild(row);
        });
      }
    } catch (err) {
      taskDatabaseRows.innerHTML = `<div class="db-empty">Error reading database: ${err.message}</div>`;
    }
  }

  async function fetchSandboxFiles() {
    try {
      const res = await fetch(`${API_BASE}/api/files`);
      if (res.ok) {
        const files = await res.json();
        if (files.length === 0) {
          sandboxFileList.innerHTML = '<li class="file-empty">No sandboxed files created yet.</li>';
          return;
        }
        sandboxFileList.innerHTML = '';
        files.forEach(file => {
          const li = document.createElement('li');
          li.className = 'file-item';
          const sizeKb = (file.size / 1024).toFixed(2);
          li.innerHTML = `
            <div class="file-info">
              <i class="fa-solid fa-file-lines"></i>
              <div>
                <div>${file.name}</div>
                <div class="file-meta">${sizeKb} KB | Last updated ${new Date(file.updatedAt).toLocaleTimeString()}</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right file-meta"></i>
          `;
          li.addEventListener('click', () => previewFile(file.name));
          sandboxFileList.appendChild(li);
        });
      }
    } catch (err) {
      sandboxFileList.innerHTML = `<li class="file-empty">Failed to load files list.</li>`;
    }
  }

  async function previewFile(filename) {
    try {
      const res = await fetch(`${API_BASE}/api/files/${filename}`);
      if (res.ok) {
        const text = await res.text();
        previewFilename.textContent = filename;
        previewContentBox.textContent = text;
        filePreviewPanel.classList.remove('hidden');
      } else {
        alert('Could not preview file contents.');
      }
    } catch (err) {
      alert('Error fetching file contents.');
    }
  }

  // Run Agent Mission Control Pipeline
  async function runAgentPipeline() {
    const prompt = agentInputPrompt.value.trim();
    if (!prompt) return;

    btnRunAgent.disabled = true;
    runningSpinner.classList.remove('hidden');
    traceLogsBox.innerHTML = '';
    reportOutputBox.innerHTML = '';
    
    // Animate Network nodes
    animateNodesStart();

    try {
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: prompt })
      });

      if (!res.ok) throw new Error('API execution failed');

      const data = await res.json();
      
      // 1. Render Trace Logs
      renderTraceLogs(data.trace);
      
      // 2. Render Markdown Report
      renderFinalReport(data.result);
      
      // 3. Refresh Side panels
      fetchTasks();
      fetchSandboxFiles();

    } catch (error) {
      traceLogsBox.innerHTML = `
        <div class="trace-item security_block">
          <span class="trace-time">${new Date().toLocaleTimeString()}</span>
          <span class="trace-sender">System</span>
          <div>Orchestration Error: ${error.message}. Is backend server running?</div>
        </div>
      `;
    } finally {
      btnRunAgent.disabled = false;
      runningSpinner.classList.add('hidden');
      animateNodesStop();
    }
  }

  function animateNodesStart() {
    nodePlanner.classList.add('working');
    nodeStudy.classList.add('working');
    nodeOptimizer.classList.add('working');
    nodeScheduler.classList.add('working');
  }

  function animateNodesStop() {
    nodePlanner.classList.remove('working');
    nodeStudy.classList.remove('working');
    nodeOptimizer.classList.remove('working');
    nodeScheduler.classList.remove('working');
  }

  function renderTraceLogs(trace) {
    if (!trace || trace.length === 0) {
      traceLogsBox.innerHTML = '<div class="db-empty">No trace output received.</div>';
      return;
    }
    traceLogsBox.innerHTML = '';
    trace.forEach(log => {
      const time = log.timestamp.split('T')[1].substring(0, 8);
      const div = document.createElement('div');
      div.className = `trace-item ${log.step}`;
      div.innerHTML = `
        <span class="trace-time">${time}</span>
        <span class="trace-sender">${log.agent} (${log.step.toUpperCase()})</span>
        <div>${log.detail}</div>
      `;
      traceLogsBox.appendChild(div);
      
      // Capture safety violations immediately
      if (log.step === 'security_block' || log.detail.includes('Security Exception')) {
        addSecurityAlert(log.detail);
      }
    });
    
    // Auto-scroll trace logs to bottom
    traceLogsBox.scrollTop = traceLogsBox.scrollHeight;
  }

  function renderFinalReport(markdown) {
    if (!markdown) {
      reportOutputBox.innerHTML = '<div class="db-empty">No report generated.</div>';
      return;
    }
    // Basic Custom Regex Markdown to HTML converter
    let html = markdown
      .replace(/##\s+(.*)/g, '<h2>$1</h2>')
      .replace(/###\s+(.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/-\s+(.*)/g, '<li>$1</li>')
      .replace(/\n\n/g, '<p></p>')
      .replace(/\n/g, '<br/>');

    reportOutputBox.innerHTML = html;
  }

  function addSecurityAlert(message) {
    // Remove static green indicator if present
    const okMsg = securityAlertsBox.querySelector('.security-ok');
    if (okMsg) okMsg.remove();

    const alert = document.createElement('div');
    alert.className = 'sec-alert-item';
    alert.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div>
        <strong>Security Triggered:</strong>
        <div>${message}</div>
      </div>
    `;
    securityAlertsBox.prepend(alert);
    
    // Animate system indicator to warning state
    updateIndicator(indSandbox, false, 'Sandbox: THREAT BLOCKED', 'yellow');
    setTimeout(() => {
      updateIndicator(indSandbox, true, 'Sandbox: Active', 'green');
    }, 4000);
  }

  // Diagnostic MCP tool execute
  async function runDiagnostic() {
    const tool = diagToolSelect.value;
    let args = {};
    
    if (tool === 'calculator' || tool === 'search_tasks') {
      try {
        args = JSON.parse(diagToolArgs.value.trim() || '{}');
      } catch (e) {
        diagOutputBox.textContent = 'Error: Invalid arguments JSON formatting.';
        diagOutputBox.className = 'diag-output error';
        diagOutputBox.classList.remove('hidden');
        return;
      }
    }

    btnRunDiagnostic.disabled = true;
    diagOutputBox.textContent = 'Invoking MCP tool via local server...';
    diagOutputBox.className = 'diag-output';
    diagOutputBox.classList.remove('hidden');

    try {
      const res = await fetch(`${API_BASE}/api/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: tool, arguments: args })
      });

      const data = await res.json();
      
      if (data.isError) {
        diagOutputBox.textContent = data.content[0].text;
        diagOutputBox.className = 'diag-output error';
        if (data.securityViolation) {
          addSecurityAlert(data.content[0].text);
        }
      } else {
        diagOutputBox.textContent = data.content[0].text;
        diagOutputBox.className = 'diag-output';
      }
    } catch (err) {
      diagOutputBox.textContent = `Execution Error: ${err.message}`;
      diagOutputBox.className = 'diag-output error';
    } finally {
      btnRunDiagnostic.disabled = false;
      fetchSandboxFiles();
      fetchTasks();
    }
  }
});
