/**
 * Medieval-themed name generator for creating people
 */

const FIRST_NAMES_MALE = [
  "Aldric", "Bram", "Cedric", "Dorian", "Edmund", "Finn", "Gareth", "Harald",
  "Ivor", "Jorah", "Kendrick", "Leofric", "Maddox", "Ned", "Oswin", "Penn",
  "Quinlan", "Roderick", "Simon", "Thaddeus", "Ulric", "Varin", "Wulfric",
  "Yorick", "Brennan", "Colin", "Duncan", "Emrys", "Godwin", "Hugo",
];

const FIRST_NAMES_FEMALE = [
  "Aelith", "Brynn", "Cora", "Dara", "Elara", "Faye", "Gwen", "Hilda",
  "Iris", "Joanna", "Kiera", "Lyra", "Mira", "Nessa", "Olwen", "Petra",
  "Quinn", "Rhea", "Sable", "Thea", "Una", "Vera", "Willa", "Yara",
  "Bronwyn", "Cerys", "Deirdre", "Eira", "Freya", "Gwyneth",
];

const SURNAMES = [
  "Smith", "Miller", "Fletcher", "Cooper", "Carter", "Baker", "Thatcher",
  "Mason", "Wright", "Fisher", "Hunter", "Brewer", "Tanner", "Weaver",
  "Sawyer", "Carpenter", "Shepherd", "Potter", "Chandler", "Archer",
  "Blackwood", "Greenfield", "Ironforge", "Stonebridge", "Riverwood",
  "Hillcrest", "Thornhill", "Ashford", "Woodward", "Fieldstone",
];

/**
 * Generate a random name
 */
export function generateName(gender: "male" | "female", seed?: number): string {
  const firstNames = gender === "male" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  
  let firstIdx: number;
  let surnameIdx: number;
  
  if (seed !== undefined) {
    // Use seed for deterministic names
    firstIdx = seed % firstNames.length;
    surnameIdx = Math.floor(seed / firstNames.length) % SURNAMES.length;
  } else {
    firstIdx = Math.floor(Math.random() * firstNames.length);
    surnameIdx = Math.floor(Math.random() * SURNAMES.length);
  }
  
  const firstName = firstNames[firstIdx];
  const surname = SURNAMES[surnameIdx];
  
  return `${firstName} ${surname}`;
}

/**
 * Generate a unique person ID
 */
let personIdCounter = 0;
export function generatePersonId(settlementId: number): string {
  personIdCounter++;
  return `person_${settlementId}_${personIdCounter}_${Date.now()}`;
}

/**
 * Reset the person ID counter (for testing)
 */
export function resetPersonIdCounter(): void {
  personIdCounter = 0;
}
