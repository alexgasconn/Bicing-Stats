import { BicingTrip } from '../types';

// Helper: Normalize string (remove accents, lowercase)
const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const parseCustomDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Clean string
  const cleanStr = dateStr.trim();
  const [datePart, timePart] = cleanStr.split(' ');
  if (!datePart) return null;
  
  const [day, month, year] = datePart.split('/');
  if (!day || !month || !year) return null;

  let hour = 0, minute = 0, second = 0;
  if (timePart) {
    const parts = timePart.split(':');
    hour = parseInt(parts[0]) || 0;
    minute = parseInt(parts[1]) || 0;
    second = parseInt(parts[2]) || 0;
  }

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hour,
    minute,
    second
  );
};

const parseDuration = (durStr: string): number => {
  if (!durStr) return 0;
  const clean = durStr.toLowerCase().replace(/[^0-9]/g, '');
  return parseInt(clean) || 0;
};

const parseCost = (costStr: string): number => {
  if (!costStr) return 0;
  let clean = costStr.replace(/[€\s]/g, '');
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, ''); 
    clean = clean.replace(',', '.');
  }
  return parseFloat(clean) || 0;
};

export const parseCSV = (csvText: string): BicingTrip[] => {
  if (!csvText) return [];
  
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const trips: BicingTrip[] = [];

  let headerIndex = -1;
  let separator = ','; 

  // Look for header in first 50 lines
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const lineNorm = normalize(lines[i]);
    
    // Check for presence of key column names (normalized)
    // We check for at least 2 strong matches to confirm it's the header
    const hasMatricula = lineNorm.includes('matricula');
    const hasInici = lineNorm.includes('inici');
    const hasLiquidacio = lineNorm.includes('liquidacio');
    const hasImport = lineNorm.includes('import');

    if ((hasMatricula && hasInici) || (hasLiquidacio && hasInici) || (hasMatricula && hasImport)) {
      headerIndex = i;
      
      const lineRaw = lines[i];
      const tabs = (lineRaw.match(/\t/g) || []).length;
      const semis = (lineRaw.match(/;/g) || []).length;
      const commas = (lineRaw.match(/,/g) || []).length;
      
      if (tabs > commas && tabs > semis) separator = '\t';
      else if (semis > commas && semis > tabs) separator = ';';
      else separator = ',';
      
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("No s'ha trobat la capçalera (Matrícula, Data d'inici).");
  }

  // Helper to split line respecting quotes (basic implementation)
  const getCols = (line: string) => line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
  
  const rawHeaders = getCols(lines[headerIndex]).map(h => normalize(h));
  
  const getIdx = (patterns: string[]) => rawHeaders.findIndex(h => patterns.some(p => h.includes(p)));

  const idxStart = getIdx(['inici', 'start']);
  const idxEnd = getIdx(['fi', 'end']);
  const idxBike = getIdx(['matricula', 'bike']); 
  const idxDuration = getIdx(['unitats', 'durada', 'tiempo', 'time']); // Smou header: "Unitats"
  const idxCost = getIdx(['import', 'cost']);
  const idxService = getIdx(['servei', 'service']);
  const idxLiquidacio = getIdx(['liquidacio', 'id']);

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const cols = getCols(line);

    // Safety check bounds
    if (idxStart === -1 || !cols[idxStart]) continue;

    // Filter Bicing
    if (idxService > -1) {
      const s = normalize(cols[idxService]);
      if (s && !s.includes('bicing')) continue;
    }

    const startDate = parseCustomDate(cols[idxStart]);
    if (!startDate) continue;

    const endDate = idxEnd > -1 ? parseCustomDate(cols[idxEnd]) : startDate;
    
    // Fix: If duration column says "13 min", parser extracts 13.
    // The column name in user sample is "Unitats".
    const duration = idxDuration > -1 ? parseDuration(cols[idxDuration]) : 0;

    trips.push({
      id: idxLiquidacio > -1 ? cols[idxLiquidacio] : `row-${i}`,
      startDate,
      endDate: endDate || startDate,
      bikeId: idxBike > -1 ? cols[idxBike] : '?',
      durationMinutes: duration,
      cost: idxCost > -1 ? parseCost(cols[idxCost]) : 0,
      service: 'Bicing'
    });
  }

  return trips;
};