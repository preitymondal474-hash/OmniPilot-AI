import orchestrator from './adk.js';
import { PlannerAgent } from './planner.js';
import { OptimizerAgent } from './optimizer.js';
import { StudyAgent } from './study.js';
import { SchedulerAgent } from './scheduler.js';

// Instantiate agents
const planner = new PlannerAgent();
const optimizer = new OptimizerAgent();
const study = new StudyAgent();
const scheduler = new SchedulerAgent();

// Register with the ADK Orchestrator
orchestrator.registerAgent(planner);
orchestrator.registerAgent(optimizer);
orchestrator.registerAgent(study);
orchestrator.registerAgent(scheduler);

export { orchestrator };
export default orchestrator;
