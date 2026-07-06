import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve standard workspace root (parent of security/ folder)
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

// Whitelisted CLI commands that are safe to run
const COMMAND_WHITELIST = ['echo', 'ver', 'date', 'time', 'whoami'];

/**
 * Sanitizes input text to prevent injection or cross-site scripting inputs.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  // Basic HTML/script stripping & cleaning
  return text
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

/**
 * Validates if a file path is strictly inside the workspace root (no path traversal).
 * @param {string} targetPath 
 * @param {string} baseDir 
 * @returns {boolean}
 */
export function validatePath(targetPath, baseDir = WORKSPACE_ROOT) {
  try {
    const absoluteBase = path.resolve(baseDir);
    const absoluteTarget = path.resolve(targetPath);
    
    // Check if the target is within the base directory
    const relative = path.relative(absoluteBase, absoluteTarget);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    // Also check if they are identical (i.e. accessing the baseDir itself is fine)
    const isIdentical = absoluteBase === absoluteTarget;
    
    return !!(isSafe || isIdentical);
  } catch (err) {
    return false;
  }
}

/**
 * Executes a whitelisted shell command safely.
 * @param {string} cmdStr - Command to run
 * @returns {Promise<{stdout: string, stderr: string, allowed: boolean}>}
 */
export function safeExecuteCommand(cmdStr) {
  return new Promise((resolve) => {
    const cleanCmd = sanitizeInput(cmdStr);
    
    // Parse first word of command
    const parts = cleanCmd.split(/\s+/);
    const baseCommand = parts[0]?.toLowerCase();

    // Check whitelist
    if (!COMMAND_WHITELIST.includes(baseCommand)) {
      return resolve({
        stdout: '',
        stderr: `Security Exception: Command '${baseCommand}' is not whitelisted. Safe commands are: ${COMMAND_WHITELIST.join(', ')}`,
        allowed: false
      });
    }

    // Check for suspicious shell characters to prevent command injection
    const commandInjectionPattern = /[&|;$`<>]/g;
    if (commandInjectionPattern.test(cleanCmd)) {
      return resolve({
        stdout: '',
        stderr: 'Security Exception: Command contains forbidden shell redirection or combination characters.',
        allowed: false
      });
    }

    // Execute the command in child process
    exec(cleanCmd, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        allowed: true
      });
    });
  });
}
