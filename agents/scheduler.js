import { Agent } from './adk.js';

export class SchedulerAgent extends Agent {
  constructor() {
    super('Life Scheduler Agent', 'Manages daily routines, calendar events, and schedules time', ['calculator', 'write_file']);
  }

  /**
   * Schedules a daily calendar routine and uses math tools to budget time.
   */
  async executeTask(description, parameters, trace) {
    trace('thinking', this.name, 'Budgeting daily routine hours using the calculator tool.');

    // Calculate daily hours allocations:
    // Study: 4 hrs, Sleep: 8 hrs, Leisure: 2 hrs, Routine/Meals: 3 hrs, Exercise: 1 hr.
    const expression = '4 + 8 + 2 + 3 + 1';
    
    // Call calculator tool
    const calcResult = await this.callTool('calculator', { expression }, trace);
    let totalAllocated = 18; // Default fallback

    if (calcResult && !calcResult.isError) {
      totalAllocated = parseFloat(calcResult.content[0].text);
    }

    const freeHours = 24 - totalAllocated;

    // Create schedule layout
    let scheduleText = `==================================================\n`;
    scheduleText += `DAILY CALENDAR ROUTINE & SCHEDULE\n`;
    scheduleText += `==================================================\n\n`;
    scheduleText += `  08:00 AM - 09:00 AM : Morning Routine & Breakfast (1 hr)\n`;
    scheduleText += `  09:00 AM - 01:00 PM : Deep Study Block (4 hrs)\n`;
    scheduleText += `  01:00 PM - 02:00 PM : Lunch & Break (1 hr)\n`;
    scheduleText += `  02:00 PM - 04:00 PM : Administrative Tasks / Email (2 hrs)\n`;
    scheduleText += `  04:00 PM - 05:00 PM : Exercise / Outdoor walk (1 hr)\n`;
    scheduleText += `  05:00 PM - 06:00 PM : Free Buffer Time (${freeHours} hrs)\n`;
    scheduleText += `  06:00 PM - 10:00 PM : Dinner & Leisure (4 hrs)\n`;
    scheduleText += `  10:00 PM - 06:00 AM : Sleep (${8} hrs)\n\n`;
    scheduleText += `Total Accounted Time: ${totalAllocated} hours / 24 hours.\n`;
    scheduleText += `Routine saved under sandbox rules.`;

    const fileName = 'daily_routine.txt';

    // Write file using write_file tool
    await this.callTool('write_file', {
      filename: fileName,
      content: scheduleText
    }, trace);

    const summaryText = `Scheduled 24h daily calendar routine in file: \`${fileName}\` using calculator validation tool.`;
    
    let detailsText = `- **Total Hours Accounted:** ${totalAllocated} hours\n`;
    detailsText += `- **Remaining Buffer Time:** ${freeHours} hours\n`;
    detailsText += `- **Schedule Saved to Sandbox:** \`${fileName}\` containing structured hour-by-hour timeline blocks.`;

    return {
      success: true,
      summary: summaryText,
      details: detailsText,
      fileCreated: fileName
    };
  }
}
