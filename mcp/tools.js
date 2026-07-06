import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath, safeExecuteCommand, sanitizeInput } from '../security/sandbox.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sandbox folder for file operations
const SANDBOX_DIR = path.resolve(__dirname, '../sandbox');

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

// MCP Tools schema definitions
export const TOOLS_SCHEMA = [
  {
    name: 'read_file',
    description: 'Reads the contents of a file inside the secure sandbox directory.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to read (e.g., tasks.json).'
        }
      },
      required: ['filename']
    }
  },
  {
    name: 'write_file',
    description: 'Writes content to a file inside the secure sandbox directory.',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The target filename.'
        },
        content: {
          type: 'string',
          description: 'The text content to write.'
        },
        append: {
          type: 'boolean',
          description: 'If true, appends content instead of overwriting.'
        }
      },
      required: ['filename', 'content']
    }
  },
  {
    name: 'calculator',
    description: 'Executes mathematical expressions securely without eval().',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression to evaluate (e.g. "2 + 2 * 4").'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'system_status',
    description: 'Retrieves current operating system details, time, and server health status.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_tasks',
    description: 'Queries key-value pair search or text search within the tasks list database.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A query string to match task names or contents.'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Tool execution dispatcher.
 * @param {string} name - Name of the tool to execute.
 * @param {Object} args - Arguments matching the tool schema.
 * @returns {Promise<{success: boolean, data: any, message: string, securityAlert?: string}>}
 */
export async function executeTool(name, args) {
  switch (name) {
    case 'read_file': {
      const { filename } = args;
      const targetPath = path.resolve(SANDBOX_DIR, filename);

      if (!validatePath(targetPath, SANDBOX_DIR)) {
        return {
          success: false,
          data: null,
          message: 'Permission Denied: Path traversal detected.',
          securityAlert: `Blocked unauthorized path access attempt: '${filename}'`
        };
      }

      if (!fs.existsSync(targetPath)) {
        return {
          success: false,
          data: null,
          message: `File not found: '${filename}'`
        };
      }

      try {
        const content = fs.readFileSync(targetPath, 'utf8');
        return {
          success: true,
          data: content,
          message: `Successfully read file '${filename}'`
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          message: `Error reading file: ${err.message}`
        };
      }
    }

    case 'write_file': {
      const { filename, content, append = false } = args;
      const targetPath = path.resolve(SANDBOX_DIR, filename);

      if (!validatePath(targetPath, SANDBOX_DIR)) {
        return {
          success: false,
          data: null,
          message: 'Permission Denied: Path traversal detected.',
          securityAlert: `Blocked unauthorized file write attempt: '${filename}'`
        };
      }

      try {
        const sanitizedContent = sanitizeInput(content);
        if (append) {
          fs.appendFileSync(targetPath, sanitizedContent + '\n', 'utf8');
        } else {
          fs.writeFileSync(targetPath, sanitizedContent, 'utf8');
        }
        return {
          success: true,
          data: { filename, size: sanitizedContent.length },
          message: `Successfully written to '${filename}'`
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          message: `Error writing file: ${err.message}`
        };
      }
    }

    case 'calculator': {
      const { expression } = args;
      // Basic validation: only allow numbers, operators, brackets, and spaces.
      const cleanExpr = expression.replace(/\s+/g, '');
      if (!/^[0-9+\-*/().]+$/.test(cleanExpr)) {
        return {
          success: false,
          data: null,
          message: 'Security Exception: Math expression contains forbidden characters.',
          securityAlert: `Calculator rejected potentially malicious expression: '${expression}'`
        };
      }
      try {
        // Safe evaluation via Function sandbox with zero access to external variables
        const evaluator = new Function(`return (${cleanExpr});`);
        const result = evaluator();
        return {
          success: true,
          data: result,
          message: `Expression evaluated to ${result}`
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          message: `Calculator Error: ${err.message}`
        };
      }
    }

    case 'system_status': {
      // Execute safe command 'ver' for Windows details
      const cmdResult = await safeExecuteCommand('ver');
      
      const totalMem = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
      const usedMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      
      return {
        success: true,
        data: {
          os: cmdResult.stdout.trim() || 'Windows OS Status',
          nodeVersion: process.version,
          time: new Date().toISOString(),
          memoryUsageMB: {
            total: totalMem,
            used: usedMem
          },
          sandboxMode: 'ACTIVE'
        },
        message: 'System status retrieved successfully'
      };
    }

    case 'search_tasks': {
      const { query } = args;
      const dbPath = path.resolve(SANDBOX_DIR, 'tasks.json');
      
      if (!fs.existsSync(dbPath)) {
        return {
          success: true,
          data: [],
          message: 'No tasks stored yet.'
        };
      }

      try {
        const raw = fs.readFileSync(dbPath, 'utf8');
        const tasks = JSON.parse(raw);
        const lowerQuery = query.toLowerCase();
        
        const results = tasks.filter(task => 
          (task.title && task.title.toLowerCase().includes(lowerQuery)) ||
          (task.description && task.description.toLowerCase().includes(lowerQuery)) ||
          (task.agent && task.agent.toLowerCase().includes(lowerQuery))
        );

        return {
          success: true,
          data: results,
          message: `Found ${results.length} tasks matching '${query}'`
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          message: `Error searching tasks: ${err.message}`
        };
      }
    }

    default:
      return {
        success: false,
        data: null,
        message: `Unknown tool: '${name}'`
      };
  }
}
