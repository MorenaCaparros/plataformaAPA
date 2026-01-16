'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
  const { perfil } = useAuth();
  const router = useRouter();
  
  const [seccionActiva, setSeccionActiva] = useState<'general' | 'seguridad' | 'logs' | 'backups'>('general');

  useEffect(() => {
    if (perfil && perfil.rol !== 'director') {
      router.push('/dashboard');
      return;
    }
  }, [perfil, router]);

  if (!perfil || perfil.rol !== 'director') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-red-600 font-semibold mb-4">⚠️ Acceso denegado</p>
          <p className="text-gray-600 mb-4">Solo directores pueden acceder a esta página.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">
              ← Volver
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600">
            Administración técnica, seguridad y mantenimiento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
              <button
                onClick={() => setSeccionActiva('general')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  seccionActiva === 'general'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                ⚙️ General
              </button>
              <button
                onClick={() => setSeccionActiva('seguridad')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  seccionActiva === 'seguridad'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔒 Seguridad
              </button>
              <button
                onClick={() => setSeccionActiva('logs')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  seccionActiva === 'logs'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 Logs de Auditoría
              </button>
              <button
                onClick={() => setSeccionActiva('backups')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  seccionActiva === 'backups'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                💾 Backups
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* General */}
            {seccionActiva === 'general' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Configuración General</h2>
                
                <div className="space-y-6">
                  {/* Nombre del programa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Programa
                    </label>
                    <input
                      type="text"
                      defaultValue="Mentes Curiosas - ONG Adelante"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Año lectivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año Lectivo
                    </label>
                    <input
                      type="number"
                      defaultValue="2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Duración máxima de sesiones offline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días máximos offline antes de alerta
                    </label>
                    <input
                      type="number"
                      defaultValue="7"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si un voluntario no sincroniza en X días, se genera una alerta
                    </p>
                  </div>

                  {/* Límite de sesiones por mes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sesiones mínimas esperadas por mes (por niño)
                    </label>
                    <input
                      type="number"
                      defaultValue="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">
                    💾 Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Seguridad */}
            {seccionActiva === 'seguridad' && (
              <div className="space-y-6">
                {/* Gestión de accesos */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Gestión de Accesos</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Requerir 2FA para directores</p>
                        <p className="text-sm text-gray-600">Autenticación de dos factores</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Sesiones inactivas (minutos)</p>
                        <p className="text-sm text-gray-600">Cerrar sesión automáticamente</p>
                      </div>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Registrar acceso a apellidos</p>
                        <p className="text-sm text-gray-600">Log cuando director ve datos completos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Encriptación */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Encriptación</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✓</span>
                        <p className="font-medium text-green-800">Datos sensibles encriptados</p>
                      </div>
                      <p className="text-sm text-green-700 ml-8">
                        Nombres completos, apellidos y fechas de nacimiento están protegidos con AES-256
                      </p>
                    </div>

                    <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 font-medium">
                      🔑 Rotar Clave de Encriptación
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      ⚠️ Esto reencriptará todos los datos sensibles. Proceso puede tardar varios minutos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Logs de Auditoría */}
            {seccionActiva === 'logs' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Logs de Auditoría</h2>
                
                <div className="mb-6">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="date"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option>Todas las acciones</option>
                      <option>Acceso a datos sensibles</option>
                      <option>Cambio de roles</option>
                      <option>Exportación de datos</option>
                      <option>Modificación de configuración</option>
                    </select>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Filtrar
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { accion: 'Acceso a apellido', usuario: 'Director', fecha: '2026-01-07 14:32', detalle: 'Niño: Legajo #1234' },
                    { accion: 'Cambio de rol', usuario: 'Director', fecha: '2026-01-07 11:15', detalle: 'Usuario: María → Coordinador' },
                    { accion: 'Exportación de reporte', usuario: 'Director', fecha: '2026-01-06 16:45', detalle: 'Tipo: General (PDF)' },
                    { accion: 'Feedback registrado', usuario: 'Director', fecha: '2026-01-05 10:20', detalle: 'Coordinador: Juan Pérez' },
                  ].map((log, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{log.accion}</p>
                          <p className="text-sm text-gray-600">{log.detalle}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{log.usuario}</p>
                          <p>{log.fecha}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 font-medium">
                  📥 Exportar Logs Completos
                </button>
              </div>
            )}

            {/* Backups */}
            {seccionActiva === 'backups' && (
              <div className="space-y-6">
                {/* Configuración de backups */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Configuración de Backups</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Backup automático diario</p>
                        <p className="text-sm text-gray-600">A las 3:00 AM</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Retención de backups</p>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option>Últimos 7 días</option>
                        <option>Últimos 30 días</option>
                        <option selected>Últimos 90 días</option>
                        <option>Último año</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Último backup */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Último Backup</h2>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">Backup exitoso</p>
                        <p className="text-sm text-green-700">Hoy a las 03:00 AM</p>
                      </div>
                      <span className="text-3xl">✓</span>
                    </div>
                    <div className="mt-3 text-sm text-green-700">
                      <p>Tamaño: 245 MB</p>
                      <p>Duración: 3 minutos 12 segundos</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">
                      ⚡ Backup Manual Ahora
                    </button>
                    <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium">
                      📥 Descargar Último Backup
                    </button>
                  </div>
                </div>

                {/* Restauración */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Restaurar desde Backup</h2>
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-sm text-red-700">
                      ⚠️ <strong>Cuidado:</strong> Restaurar un backup sobrescribirá todos los datos actuales.
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4">
                    <option>Seleccionar backup a restaurar...</option>
                    <option>2026-01-07 03:00 (245 MB)</option>
                    <option>2026-01-06 03:00 (243 MB)</option>
                    <option>2026-01-05 03:00 (241 MB)</option>
                  </select>

                  <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium">
                    ↩️ Restaurar Base de Datos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
