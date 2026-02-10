import { Person, JobType } from "./Person";

/**
 * Base experience gain per turn of work
 */
export const BASE_XP_PER_TURN = 5;

/**
 * Gain experience for working a job
 */
export function gainExperience(
  person: Person,
  jobType: JobType,
  hoursWorked: number = 8 // Full day's work
): void {
  if (jobType === JobType.None) return;
  
  const xpGain = BASE_XP_PER_TURN * (hoursWorked / 8);
  
  // Increase skill (capped at 100)
  person.skills[jobType] = Math.min(100, person.skills[jobType] + xpGain);
  
  // Track experience gained today
  person.experienceToday[jobType] = (person.experienceToday[jobType] || 0) + xpGain;
}

/**
 * Calculate productivity multiplier for a person doing a job
 * Returns a multiplier between 0.5 (untrained) and 1.5 (expert)
 */
export function getProductivity(person: Person, jobType: JobType): number {
  const skill = person.skills[jobType];
  
  // Skill affects productivity:
  // 0 skill = 50% productivity (untrained)
  // 50 skill = 100% productivity (trained)
  // 100 skill = 150% productivity (expert)
  const skillMultiplier = 0.5 + (skill / 100);
  
  // Health affects productivity (0-100%)
  const healthMultiplier = person.health / 100;
  
  // Happiness affects productivity (80-120%)
  const happinessMultiplier = 0.8 + (person.happiness / 100) * 0.4;
  
  // Combine all factors
  let productivity = skillMultiplier * healthMultiplier * happinessMultiplier;
  
  // Age affects productivity
  if (person.age < 14) {
    productivity *= 0.3; // Children work at 30%
  } else if (person.age > 60) {
    productivity *= 0.8; // Elders work at 80%
  }
  
  return productivity;
}

/**
 * Get skill level as a percentage (0-100)
 */
export function getSkillLevel(person: Person, jobType: JobType): number {
  return person.skills[jobType];
}

/**
 * Get the best job for a person based on their skills
 */
export function getBestJob(person: Person): JobType {
  let bestJob = JobType.None;
  let bestSkill = 0;
  
  for (const jobType of Object.values(JobType)) {
    const skill = person.skills[jobType];
    if (skill > bestSkill) {
      bestSkill = skill;
      bestJob = jobType;
    }
  }
  
  return bestJob === JobType.None ? JobType.Farmer : bestJob;
}

/**
 * Calculate average productivity of a group of workers
 */
export function getAverageProductivity(people: Person[], jobType: JobType): number {
  if (people.length === 0) return 0;
  
  const totalProductivity = people.reduce((sum, person) => {
    return sum + getProductivity(person, jobType);
  }, 0);
  
  return totalProductivity / people.length;
}

/**
 * Calculate total productivity of a group of workers
 */
export function getTotalProductivity(people: Person[], jobType: JobType): number {
  return people.reduce((sum, person) => {
    return sum + getProductivity(person, jobType);
  }, 0);
}

/**
 * Reset daily experience tracking (call at start of each turn)
 */
export function resetDailyExperience(person: Person): void {
  person.experienceToday = {};
}
