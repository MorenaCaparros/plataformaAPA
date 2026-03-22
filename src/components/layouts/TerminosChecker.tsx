'use client';

import { useState, useEffect } from 'react';
import TerminosModal from '@/components/ui/TerminosModal';

const STORAGE_KEY = 'apa-terminos-aceptados';

/**
 * Componente cliente que verifica si el usuario aceptó los T&C.
 * Si no los aceptó, muestra el modal bloqueante.
 * Se incluye en el layout del dashboard.
 */
export default function TerminosChecker() {
  const [checked, setChecked] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    // Si ya aceptó en esta sesión/navegador, no volver a mostrar
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setChecked(true);
      return;
    }

    let mounted = true;
    fetch('/api/admin/terminos')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setChecked(true);
        if (!data.aceptado) {
          setMostrarModal(true);
        } else {
          // Guardar en localStorage para no volver a consultar
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      })
      .catch(() => {
        // Si falla la verificación (ej: usuario no autenticado todavía), no bloquear
        if (mounted) setChecked(true);
      });
    return () => { mounted = false; };
  }, []);

  if (!checked || !mostrarModal) return null;

  return (
    <TerminosModal
      onAceptar={() => {
        setMostrarModal(false);
        localStorage.setItem(STORAGE_KEY, 'true');
      }}
    />
  );
}
