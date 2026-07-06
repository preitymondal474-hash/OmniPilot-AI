import mcpServer from '../mcp/mcp-server.js';

/**
 * Base Agent Class representing a specialized worker.
 */
export class Agent {
  constructor(name, role, allowedTools) {
    this.name = name;
    this.role = role;
    this.allowedTools = allowedTools;
  }

  /**
   * Safe wrapper to call MCP tools from the agent context.
   * Checks if tool is in the agent's allowed toolset.
   */
  async callTool(toolName, args, traceCallback) {
    if (!this.allowedTools.includes(toolName)) {
      const msg = `Security Alert: Agent '${this.name}' tried to use unauthorized tool '${toolName}'.`;
      traceCallback?.('security_block', this.name, msg);
      return {
        isError: true,
        securityViolation: true,
        securityAlert: msg,
        content: [{ type: 'text', text: 'Error: Unauthorized tool access.' }]
      };
    }

    traceCallback?.('tool_call', this.name, `Calling tool '${toolName}' with arguments: ${JSON.stringify(args)}`);

    const result = await mcpServer.callTool(toolName, args);

    if (result.securityViolation) {
      traceCallback?.('security_block', this.name, `Security Sandbox BLOCKED tool: ${result.securityAlert}`);
    } else {
      traceCallback?.('tool_response', this.name, `Tool '${toolName}' returned: ${result.content[0].text.substring(0, 150)}...`);
    }

    return result;
  }
}

/**
 * Orchestrator coordinates messages, traces agent steps, and manages task states.
 */
export class ADKOrchestrator {
  constructor() {
    this.agents = {};
    this.traceLog = [];
  }

  registerAgent(agent) {
    this.agents[agent.name] = agent;
  }

  addTrace(step, agent, detail) {
    this.traceLog.push({
      timestamp: new Date().toISOString(),
      step,
      agent,
      detail
    });
  }

  getTrace() {
    return this.traceLog;
  }

  clearTrace() {
    this.traceLog = [];
  }

  /**
   * Run the planning and collaboration process.
   * @param {string} userInput - The user's goal prompt.
   * @returns {Promise<{result: string, trace: Array, success: boolean}>}
   */
  async runTask(userInput) {
    this.clearTrace();
    this.addTrace('start', 'Orchestrator', `Received task: "${userInput}"`);

    const planner = this.agents['Planner Agent'];
    const optimizer = this.agents['Task Optimization Agent'];
    const study = this.agents['Exam/Study Agent'];
    const scheduler = this.agents['Life Scheduler Agent'];

    if (!planner) {
      return {
        success: false,
        result: 'Error: Planner Agent is not registered.',
        trace: this.traceLog
      };
    }

    // Step 1: Planner breaks down the user request
    this.addTrace('dispatch', 'Orchestrator', 'Delegating input to Planner Agent...');
    const plan = await planner.executeTask(userInput, this.addTrace.bind(this));
    
    this.addTrace('message', 'Planner Agent', `Constructed plan: ${JSON.stringify(plan.tasks)}`);

    const results = {};

    // Step 2: Route sub-tasks to matching agents
    for (const subTask of plan.tasks) {
      const { agentName, description, parameters } = subTask;
      const agent = this.agents[agentName];

      if (!agent) {
        this.addTrace('warning', 'Orchestrator', `Specialist agent '${agentName}' not found. Skipping task.`);
        continue;
      }

      this.addTrace('dispatch', 'Orchestrator', `Routing task to ${agentName}: "${description}"`);
      
      let agentRes;
      if (agentName === 'Exam/Study Agent') {
        agentRes = await study.executeTask(description, parameters, this.addTrace.bind(this));
      } else if (agentName === 'Life Scheduler Agent') {
        agentRes = await scheduler.executeTask(description, parameters, this.addTrace.bind(this));
      } else if (agentName === 'Task Optimization Agent') {
        agentRes = await optimizer.executeTask(description, parameters, this.addTrace.bind(this));
      }

      results[agentName] = agentRes;
      this.addTrace('message', agentName, `Task completed. Result: ${agentRes.summary}`);
    }

    // Step 3: Planner consolidates specialist outputs into final result
    this.addTrace('consolidate', 'Orchestrator', 'Consolidating specialist agent results...');
    const finalReport = await planner.consolidate(userInput, results, this.addTrace.bind(this));

    this.addTrace('finish', 'Orchestrator', 'Execution complete. Summary generated.');

    return {
      success: true,
      result: finalReport,
      trace: this.traceLog
    };
  }
}

export const orchestrator = new ADKOrchestrator();
export default orchestrator;
