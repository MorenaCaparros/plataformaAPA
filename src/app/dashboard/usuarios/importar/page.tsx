'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ImportarUsuariosPage() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Solo director puede acceder (rol con máximo privilegio)
  if (perfil && perfil.rol !== 'director') {
    router.push('/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setResultado(null);
    }
  };

  const parsearCSV = (texto: string) => {
    const lineas = texto.split('\n').filter(l => l.trim());
    const headers = lineas[0].split(',').map(h => h.trim());
    
    return lineas.slice(1).map(linea => {
      const valores = linea.split(',').map(v => v.trim());
      const usuario: any = {};
      headers.forEach((header, i) => {
        usuario[header] = valores[i] || '';
      });
      return usuario;
    });
  };

  const handleImportar = async () => {
    if (!archivo) return;

    setProcesando(true);
    setResultado(null);

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResultado({ error: 'No hay sesión activa' });
        return;
      }

      // Leer archivo CSV
      const texto = await archivo.text();
      const usuarios = parsearCSV(texto);

      // Enviar a API con token en header
      const response = await fetch('/api/usuarios/importar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ usuarios }),
      });

      const data = await response.json();
      setResultado(data);
    } catch (error: any) {
      setResultado({
        error: error.message || 'Error al procesar el archivo',
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Importar Usuarios desde CSV
          </h1>

          {/* Instrucciones */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              📋 Formato del CSV
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
              El archivo debe tener las siguientes columnas (sin espacios):
            </p>
            <code className="block bg-white dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
              email,nombre,apellido,rol,equipo,telefono,password
              <br />
              voluntario1@apa.org,Juan,Pérez,voluntario,Las Dalias,123456789,MiPassword123
              <br />
              coord1@apa.org,María,González,coordinador,La Herradura,987654321,Segura456
            </code>
            <div className="mt-3 text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <p><strong>Roles válidos:</strong> voluntario, coordinador, psicopedagogia, director</p>
              <p><strong>Equipos válidos:</strong> Las Dalias, La Herradura, Parque Palermo, Villa de Paso</p>
              <p><strong>Password:</strong> Mínimo 8 caracteres. Si se deja vacío, se genera automáticamente.</p>
            </div>
          </div>

          {/* Selector de archivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
            />
          </div>

          {/* Botón importar */}
          <button
            onClick={handleImportar}
            disabled={!archivo || procesando}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {procesando ? 'Procesando...' : 'Importar Usuarios'}
          </button>

          {/* Resultados */}
          {resultado && (
            <div className="mt-6">
              {resultado.error ? (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                    ❌ Error
                  </h3>
                  <p className="text-red-800 dark:text-red-400">{resultado.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                      ✅ Importación Completada
                    </h3>
                    <div className="text-green-800 dark:text-green-400">
                      <p>✓ Exitosos: {resultado.exitosos}</p>
                      {resultado.errores > 0 && (
                        <p className="text-amber-600">⚠ Errores: {resultado.errores}</p>
                      )}
                    </div>
                  </div>

                  {/* Lista de exitosos */}
                  {resultado.detalle?.exitosos?.length > 0 && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Usuarios creados:
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {resultado.detalle.exitosos.map((email: string) => (
                          <li key={email}>✓ {email}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lista de errores */}
                  {resultado.detalle?.errores?.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        Errores:
                      </h4>
                      <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-2">
                        {resultado.detalle.errores.map((err: any, i: number) => (
                          <li key={i}>
                            ✗ {err.email}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
