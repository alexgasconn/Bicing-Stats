import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseCSV } from './utils/parser';
import { BicingTrip } from './types';

const App: React.FC = () => {
  const [trips, setTrips] = useState<BicingTrip[] | null>(null);

  const handleDataLoaded = (csvContents: string[]) => {
    try {
      let allTrips: BicingTrip[] = [];
      
      // 1. Parse all files
      csvContents.forEach(content => {
        const parsed = parseCSV(content);
        allTrips = [...allTrips, ...parsed];
      });

      if (allTrips.length === 0) {
        alert("S'han llegit els fitxers però no s'han trobat trajectes de Bicing. Revisa que siguin exportacions correctes de Smou.");
        return;
      }

      // 2. Deduplicate
      // We prioritize the ID provided by Smou (Número liquidació).
      // If the parser gave a generic 'row-X' ID, we generate a composite ID to be safer during merge.
      const uniqueTripsMap = new Map<string, BicingTrip>();

      allTrips.forEach(trip => {
        let uniqueId = trip.id;
        
        // If ID is generic (parser fallback), create a composite key: Date + BikeID
        if (trip.id.startsWith('row-')) {
          uniqueId = `${trip.startDate.getTime()}-${trip.bikeId}`;
        }

        if (!uniqueTripsMap.has(uniqueId)) {
          uniqueTripsMap.set(uniqueId, trip);
        }
      });

      const uniqueTrips = Array.from(uniqueTripsMap.values());

      // Optional: Inform user if duplicates were removed
      if (uniqueTrips.length < allTrips.length) {
        console.log(`Eliminats ${allTrips.length - uniqueTrips.length} duplicats.`);
      }

      setTrips(uniqueTrips);
    } catch (error) {
      console.error("Failed to parse", error);
      alert("Error processant les dades: " + (error instanceof Error ? error.message : "Error desconegut"));
    }
  };

  const handleReset = () => {
    setTrips(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar decoration */}
      <div className="h-2 w-full bg-bicing"></div>
      
      <main className="flex-grow flex flex-col">
        {!trips ? (
          <div className="flex-grow flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
             <div className="text-center mb-10 mt-10">
               <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
                 BICING <span className="text-bicing">WRAPPED</span>
               </h1>
               <p className="text-xl text-gray-500 max-w-xl mx-auto">
                 La teva vida en bici, visualitzada. Dades 100% privades.
               </p>
             </div>
             
             <FileUpload onDataLoaded={handleDataLoaded} />
             
             {/* INSTRUCTIONS SECTION */}
             <div className="mt-16 max-w-5xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-12">
                  {/* Step by Step */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="bg-bicing text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                      Com baixar les dades
                    </h3>
                    <ol className="space-y-4 text-gray-600 relative border-l-2 border-gray-100 ml-3 pl-6">
                      <li className="relative">
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                        Entra a la web de <strong>smou.cat</strong> i accedeix a la teva <strong>Zona d'Usuari</strong>.
                      </li>
                      <li className="relative">
                         <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                        Al menú lateral esquerre, clica a <strong>Consum</strong> i selecciona la pestanya superior <strong>Activitat</strong>.
                      </li>
                      <li className="relative">
                         <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                        A la dreta, obre el desplegable <strong>Filtres</strong>.
                      </li>
                      <li className="relative">
                         <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                        A "Servei", marca només <strong>Bicing</strong>.
                      </li>
                      <li className="relative">
                         <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                        Selecciona el rang de dates (ex: Tot el 2024, o des del 2020) i clica <strong>Cercar</strong>.
                      </li>
                    </ol>
                  </div>

                  {/* Export & Import */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                      Exportació i Visualització
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                           ⚠️ El botó màgic
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Un cop carregada la taula a Smou, busca la icona petita d'<strong>Excel (XLS)</strong> just a sobre o sota de la llista de resultats (a la dreta).
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          No facis servir el PDF, necessitem l'Excel per calcular les estadístiques!
                        </p>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-2">Tens molts anys d'història?</h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex gap-2 items-start">
                            <span className="text-bicing font-bold">»</span>
                            <span>Si Smou divideix els resultats en pàgines, hauràs de baixar un Excel per cada pàgina o rang d'anys.</span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="text-bicing font-bold">»</span>
                            <span><strong>No pateixis!</strong> Selecciona TOTS els fitxers de cop quan els pugis aquí. Nosaltres els ajuntarem i traurem els repetits.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="mt-8 text-center text-gray-400 text-xs max-w-md">
               <p>Privadesa total: El processament es fa localment al teu navegador.</p>
             </div>
          </div>
        ) : (
          <Dashboard trips={trips} onReset={handleReset} />
        )}
      </main>
      
      <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-200 bg-white mt-auto">
        <p>Fet amb ❤️ per a Barcelona. No afiliat a Bicing ni Smou.</p>
      </footer>
    </div>
  );
};

export default App;