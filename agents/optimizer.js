import { Agent } from './adk.js';

export class OptimizerAgent extends Agent {
  constructor() {
    super('Task Optimization Agent', 'Prioritizes and structures tasks for execution', ['write_file', 'read_file', 'search_tasks']);
  }

  /**
   * Prioritizes tasks and generates tasks.json database state.
   */
  async executeTask(description, parameters, trace) {
    trace('thinking', this.name, 'Evaluating task weights and writing structured JSON task list.');

    // Define prioritized list of tasks to register in the workspace mock database
    const tasksDb = [
      {
        id: 'T-101',
        title: 'Review Study Guide syllabus objectives',
        priority: 'CRITICAL',
        status: 'Pending',
        agent: 'Exam/Study Agent',
        timeAllocated: '4 Hours'
      },
      {
        id: 'T-102',
        title: 'Map daily life routine calendar buffers',
        priority: 'HIGH',
        status: 'Pending',
        agent: 'Life Scheduler Agent',
        timeAllocated: '1 Hour'
      },
      {
        id: 'T-103',
        title: 'Perform Sandbox system verification check',
        priority: 'MEDIUM',
        status: 'Completed',
        agent: 'Planner Agent',
        timeAllocated: '30 Mins'
      }
    ];

    const fileName = 'tasks.json';

    // Write database content using write_file tool
    await this.callTool('write_file', {
      filename: fileName,
      content: JSON.stringify(tasksDb, null, 2)
    }, trace);

    // Build markdown checklist representation
    let detailsText = `Structured and registered following prioritized items into local database file \`${fileName}\`:\n\n`;
    
    tasksDb.forEach(t => {
      const icon = t.status === 'Completed' ? '✅' : '⏳';
      detailsText += `1. **[${t.priority}]** ${icon} \`${t.id}\` - ${t.title} *(Assignee: ${t.agent}, Duration: ${t.timeAllocated})*\n`;
    });

    const summaryText = `Optimized task list and successfully saved database state into sandbox: \`${fileName}\`.`;

    return {
      success: true,
      summary: summaryText,
      details: detailsText,
      fileCreated: fileName
    };
  }
}
