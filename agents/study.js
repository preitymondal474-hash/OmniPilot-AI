import { Agent } from './adk.js';

export class StudyAgent extends Agent {
  constructor() {
    super('Exam/Study Agent', 'Builds study plans and exam preparation guidelines', ['write_file', 'read_file']);
  }

  /**
   * Generates a study syllabus and practice questions, saving them safely.
   */
  async executeTask(description, parameters, trace) {
    const { subject = 'General Studies' } = parameters;
    trace('thinking', this.name, `Formulating study plan and exam guide for: ${subject}`);

    const topics = {
      Biology: [
        'Cell Biology & Mitosis/Meiosis structure',
        'Genetics: DNA replication and Mendelian inheritance',
        'Ecology: Ecosystem dynamics and trophic structures'
      ],
      Mathematics: [
        'Calculus: Limits, Derivatives, and Integrals',
        'Linear Algebra: Vector transformations and Matrix operations',
        'Probability: Bayes Theorem and conditional distributions'
      ],
      Chemistry: [
        'Organic Chemistry: Alkane reactions and functional groups',
        'Physical Chemistry: Thermodynamics and Gibbs Free Energy',
        'Inorganic Chemistry: Periodic trends and coordinate complexes'
      ],
      History: [
        'World War II: Triggers, alliances, and global aftermath',
        'The Industrial Revolution: Economic shifts and urbanization',
        'Ancient Civilizations: Mesopotamian and Roman structures'
      ]
    }[subject] || [
      'Core concepts overview',
      'Advanced theories and case studies',
      'Revision exercises and final synthesis'
    ];

    // Build the Markdown content for the file
    let fileContent = `==================================================\n`;
    fileContent += `OFFLINE EXAM PREPARATION GUIDE: ${subject.toUpperCase()}\n`;
    fileContent += `==================================================\n\n`;
    fileContent += `### TARGET STUDY TOPICS:\n`;
    topics.forEach((t, i) => {
      fileContent += `  ${i + 1}. [ ] ${t}\n`;
    });
    fileContent += `\n### ACTIVE RECALL QUIZ:\n`;
    fileContent += `  Q1: Write down the definition of the central concept of ${subject} without looking at notes.\n`;
    fileContent += `  Q2: What is the most common misconception about this subject, and how do you resolve it?\n\n`;
    fileContent += `Study Guide generated successfully under sandboxed agent execution environment.`;

    const fileName = `study_guide_${subject.toLowerCase()}.txt`;
    
    // Save study guide using allowed write_file tool
    const toolRes = await this.callTool('write_file', {
      filename: fileName,
      content: fileContent
    }, trace);

    let summaryText = `Generated offline study guide for **${subject}** inside file: \`${fileName}\`.`;
    let detailsText = `- **Target Subject:** ${subject}\n`;
    detailsText += `- **Topics Covered:**\n`;
    topics.forEach(t => {
      detailsText += `  - ${t}\n`;
    });
    detailsText += `- **Practice Exercises:** Included 2 active-recall quiz prompts inside the generated document \`${fileName}\`.`;

    return {
      success: true,
      summary: summaryText,
      details: detailsText,
      fileCreated: fileName
    };
  }
}
