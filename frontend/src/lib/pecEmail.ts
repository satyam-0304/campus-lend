// Utility for PEC domain validation and email parsing

export const PEC_DOMAIN = '@pec.edu.in';

export const PEC_HOSTELS = [
  'Aravali',
  'Kurukshetra',
  'Shivalik',
  'Himalaya',
  'Kalpana Chawla',
  'Vindhya',
] as const;

export type PecHostel = (typeof PEC_HOSTELS)[number];

export interface ParsedPecEmail {
  isValid: boolean;
  namePrefix: string;
  formattedName: string;
  degreeCode: string;
  degree: string;
  batchYear: string;
  branchCode: string;
  branchName: string;
  academicSummary: string;
}

const DEGREE_MAP: Record<string, string> = {
  bt: 'B.Tech',
  mt: 'M.Tech',
  phd: 'Ph.D',
  bdes: 'B.Des',
  msc: 'M.Sc',
};

const BRANCH_MAP: Record<string, string> = {
  cse: 'Computer Science & Engineering',
  ece: 'Electronics & Communication Engineering',
  ee: 'Electrical Engineering',
  me: 'Mechanical Engineering',
  ce: 'Civil Engineering',
  civil: 'Civil Engineering',
  pie: 'Production & Industrial Engineering',
  pr: 'Production Engineering',
  meta: 'Metallurgical & Materials Engineering',
  mse: 'Materials Science & Engineering',
  aero: 'Aerospace Engineering',
  ae: 'Aerospace Engineering',
  ds: 'Data Science',
  ai: 'Artificial Intelligence',
};

/**
 * Checks if the given email is a valid @pec.edu.in domain
 */
export function isValidPecEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith(PEC_DOMAIN) && clean.length > PEC_DOMAIN.length;
}

/**
 * Parses a PEC email like 'student.bt24cse@pec.edu.in'
 * and extracts degree, batch year, branch, and suggested name.
 */
export function parsePecEmail(email: string): ParsedPecEmail {
  const clean = (email || '').trim().toLowerCase();

  const fallback: ParsedPecEmail = {
    isValid: isValidPecEmail(clean),
    namePrefix: '',
    formattedName: '',
    degreeCode: '',
    degree: '',
    batchYear: '',
    branchCode: '',
    branchName: '',
    academicSummary: '',
  };

  if (!isValidPecEmail(clean)) {
    return fallback;
  }

  // Extract the local part before @pec.edu.in
  const localPart = clean.slice(0, -PEC_DOMAIN.length);

  // Standard student email pattern: <name>.<degree><year><branch>
  // e.g. student.bt24cse
  const studentPattern = /^([a-z0-9_-]+)\.([a-z]+)(\d{2})([a-z]+)$/i;
  const match = localPart.match(studentPattern);

  if (match) {
    const [, rawName, rawDegree, rawYear, rawBranch] = match;
    const degree = DEGREE_MAP[rawDegree] || rawDegree.toUpperCase();
    const batchYear = `20${rawYear}`;
    const branchName = BRANCH_MAP[rawBranch] || rawBranch.toUpperCase();
    const branchCode = rawBranch.toUpperCase();

    // Format raw name like 'student' -> 'Student'
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    return {
      isValid: true,
      namePrefix: rawName,
      formattedName,
      degreeCode: rawDegree,
      degree,
      batchYear,
      branchCode,
      branchName,
      academicSummary: `${degree} ${branchCode} • Batch of ${batchYear}`,
    };
  }

  // Graceful fallback for non-standard formats (e.g. name only or staff)
  const namePart = localPart.split('.')[0] || localPart;
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  return {
    ...fallback,
    isValid: true,
    namePrefix: namePart,
    formattedName,
    academicSummary: 'PEC Campus Community',
  };
}
