import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Loader2, Camera } from 'lucide-react';

const QRScanner = ({ apiUrl }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(decodedText) {
      try {
        const data = JSON.parse(decodedText);
        if (data.buyer && data.seats) {
          verifyQR(data);
          scanner.clear();
        }
      } catch (e) {
        console.error("QR no válido", e);
      }
    }

    function onScanError(err) {
      // Silenciosamente ignoramos errores de escaneo comunes
    }

    return () => {
      scanner.clear().catch(err => console.error("Error al limpiar scanner", err));
    };
  }, []);

  const verifyQR = async (data) => {
    setIsVerifying(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setScanResult(result);
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    window.location.reload(); // Forma más simple de reiniciar el scanner de la librería
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
        <Camera className="text-indigo-600" /> Control de Acceso
      </h2>

      {!scanResult && !isVerifying && (
        <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700"></div>
      )}

      {isVerifying && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticidad...</p>
        </div>
      )}

      {scanResult && (
        <div className={`p-6 rounded-xl text-center ${scanResult.valid ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
          {scanResult.valid ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h3 className={`text-2xl font-black mb-2 ${scanResult.valid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {scanResult.valid ? 'ACCESO VÁLIDO' : 'ACCESO DENEGADO'}
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6 inline-block text-left">
            <p className="font-bold text-gray-900 dark:text-white border-b pb-2 mb-2">
              Comprador: <span className="text-indigo-600">{scanResult.buyer}</span>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300">
              {scanResult.details.map((d, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>Mesa {d.mesa} - Asiento {d.asiento}</span>
                  <span className={d.status === 'VALID' ? 'text-green-600' : 'text-red-600 font-bold'}>
                    {d.status === 'VALID' ? '✓' : `✗ (${d.reason})`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={resetScanner}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Escanear Siguiente
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <XCircle size={20} /> {error}
          <button onClick={resetScanner} className="ml-auto underline">Reintentar</button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
