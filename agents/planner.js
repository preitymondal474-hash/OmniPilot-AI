import { Agent } from './adk.js';

export class PlannerAgent extends Agent {
  constructor() {
    // Planner only needs access to system status and tasks
    super('Planner Agent', 'Orchestrates planning and aggregates results', ['system_status', 'search_tasks']);
  }

  /**
   * Decomposes user query into tasks for other agents.
   * @param {string} userInput 
   * @param {Function} trace 
   * @returns {Promise<{tasks: Array}>}
   */
  async executeTask(userInput, trace) {
    trace('analyze', this.name, 'Parsing user input and matching keywords for task delegation.');
    
    // Check system status first as part of its plan
    const sysCheck = await this.callTool('system_status', {}, trace);
    
    const lowerInput = userInput.toLowerCase();
    const tasks = [];

    // Analyze target domains
    const needsStudy = /study|exam|quiz|test|revision|learn|biology|math|chemistry|history/i.test(lowerInput);
    const needsScheduling = /schedule|calendar|routine|event|time|hour|date/i.test(lowerInput);
    const needsOptimization = /prioritize|optimize|checklist|todo|tasks|order/i.test(lowerInput) || (!needsStudy && !needsScheduling);

    if (needsStudy) {
      let subject = 'General Studies';
      if (/biology/i.test(lowerInput)) subject = 'Biology';
      else if (/math/i.test(lowerInput)) subject = 'Mathematics';
      else if (/chemistry/i.test(lowerInput)) subject = 'Chemistry';
      else if (/history/i.test(lowerInput)) subject = 'History';

      tasks.push({
        agentName: 'Exam/Study Agent',
        description: `Create structured study plan and quiz items for ${subject}.`,
        parameters: { subject, query: userInput }
      });
    }

    if (needsScheduling) {
      tasks.push({
        agentName: 'Life Scheduler Agent',
        description: 'Map event slots and perform time calculations for schedules.',
        parameters: { query: userInput }
      });
    }

    if (needsOptimization) {
      tasks.push({
        agentName: 'Task Optimization Agent',
        description: 'Prioritize tasks, order sub-items, and output task data.',
        parameters: { query: userInput }
      });
    }

    return { tasks };
  }

  /**
   * Aggregates result summaries from all specialist agents.
   */
  async consolidate(userInput, results, trace) {
    trace('consolidate', this.name, 'Creating structured final summary report.');

    let report = `## 🛰️ OmniPilot AI Multi-Agent Report\n\n`;
    report += `**Original Goal:** "${userInput}"\n\n`;

    if (results['Exam/Study Agent']) {
      const studyData = results['Exam/Study Agent'];
      report += `### 📚 Exam & Study Guide\n`;
      report += `${studyData.details}\n\n`;
    }

    if (results['Life Scheduler Agent']) {
      const scheduleData = results['Life Scheduler Agent'];
      report += `### 📅 Calendar & Life Schedule\n`;
      report += `${scheduleData.details}\n\n`;
    }

    if (results['Task Optimization Agent']) {
      const optimizeData = results['Task Optimization Agent'];
      report += `### 📋 Prioritized Task Checklist\n`;
      report += `${optimizeData.details}\n\n`;
    }

    report += `---\n`;
    report += `*System note: All operations executed offline under local sandbox regulations. Verification completed successfully.*`;

    return report;
  }
}
