import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (contents: string[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

        if (isExcel) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
              resolve(csvOutput);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsArrayBuffer(file);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const fileList = Array.from(files) as File[];
      const promises = fileList.map(file => processFile(file));
      const results = await Promise.all(promises);
      
      onDataLoaded(results);
    } catch (error) {
      console.error("File upload error", error);
      setErrorMsg("Error carregant els fitxers. Assegura't que són vàlids.");
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded]);

  const handleLoadSample = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
        // Use Vite's glob import to get all xlsx files from the data folder
        // This requires the project to be built with Vite (which supports import.meta.glob)
        // We use eager: true to get the URL paths immediately
        const globFiles = (import.meta as any).glob('../data/*.xlsx', { 
            eager: true, 
            query: '?url', 
            import: 'default' 
        });

        const urls = Object.values(globFiles) as string[];

        if (urls.length === 0) {
            throw new Error("No s'han trobat fitxers .xlsx a la carpeta data.");
        }

        console.log(`Trobats ${urls.length} fitxers de mostra a la carpeta data.`);

        const filePromises = urls.map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error carregant ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) return null;

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return XLSX.utils.sheet_to_csv(worksheet);
        });

        const results = await Promise.all(filePromises);
        const validResults = results.filter((r): r is string => r !== null);
        
        if (validResults.length === 0) throw new Error("Els fitxers de mostra estan buits.");
        
        onDataLoaded(validResults);

    } catch (error) {
        console.error("Sample load error", error);
        setErrorMsg("No s'han pogut carregar les dades de mostra. Assegura't que hi ha fitxers .xlsx a la carpeta 'data'.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl border-2 border-dashed border-red-200 hover:border-red-500 transition-colors cursor-pointer group mb-6 relative overflow-hidden">
        
        {loading && (
             <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                 <div className="flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-bicing border-t-transparent mb-2"></div>
                    <span className="text-bicing font-bold animate-pulse">Processant dades...</span>
                 </div>
             </div>
        )}

        <div className="mb-4 transition-transform group-hover:scale-110 duration-300">
            <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-bicing absolute top-0 left-0 transform -translate-x-2 -translate-y-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-bicing relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Puja els teus fitxers</h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
            Pots seleccionar <strong>múltiples fitxers</strong> (Excel o CSV) de cop. Nosaltres unificarem les dades.
        </p>
        
        <label className={`relative cursor-pointer bg-bicing hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}>
            <span>Seleccionar fitxers</span>
            <input 
            type="file" 
            multiple
            accept=".csv,.txt,.xls,.xlsx" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={loading}
            />
        </label>
        
        <div className="mt-4 text-xs text-gray-400">
            Compatible amb múltiples fitxers Smou (.xls, .xlsx, .csv)
        </div>
        </div>

        {/* Separator */}
        <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">O si no tens dades</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Demo Button */}
        <div className="flex justify-center">
            <button 
                onClick={handleLoadSample}
                disabled={loading}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all text-sm group"
            >
                <span className="text-xl group-hover:scale-110 transition-transform">🧪</span>
                <span>Carregar dades de mostra</span>
            </button>
        </div>

        {/* Error Message */}
        {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-in fade-in">
                ⚠️ {errorMsg}
            </div>
        )}

    </div>
  );
};