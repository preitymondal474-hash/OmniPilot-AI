import { TOOLS_SCHEMA, executeTool } from './tools.js';

/**
 * Mock Model Context Protocol (MCP) Server Router.
 * Emulates standardized tool access for AI agents.
 */
class MCPServer {
  constructor() {
    this.tools = TOOLS_SCHEMA;
  }

  /**
   * Returns list of all available tools and their JSON Schema parameters.
   * Format conforms to standard MCP listTools response.
   */
  listTools() {
    return {
      tools: this.tools
    };
  }

  /**
   * Dispatches command tool calls from Agents.
   * Matches JSON-RPC schema formats.
   * @param {string} toolName - Name of the tool.
   * @param {Object} args - Arguments to pass.
   * @returns {Promise<Object>} Response envelope containing tool results and logs.
   */
  async callTool(toolName, args) {
    const tool = this.tools.find(t => t.name === toolName);
    
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool '${toolName}' not found.`
          }
        ]
      };
    }

    // Validate parameter presence
    const schemaProps = tool.parameters?.properties || {};
    const requiredProps = tool.parameters?.required || [];
    const missing = requiredProps.filter(prop => args[prop] === undefined);

    if (missing.length > 0) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Missing required parameters for tool '${toolName}': ${missing.join(', ')}`
          }
        ]
      };
    }

    // Run execution logic
    const result = await executeTool(toolName, args);

    if (!result.success) {
      return {
        isError: true,
        securityViolation: !!result.securityAlert,
        securityAlert: result.securityAlert || null,
        content: [
          {
            type: 'text',
            text: result.message
          }
        ]
      };
    }

    return {
      isError: false,
      securityViolation: false,
      securityAlert: result.securityAlert || null,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.data, null, 2)
        }
      ],
      message: result.message
    };
  }
}

export const mcpServer = new MCPServer();
export default mcpServer;
