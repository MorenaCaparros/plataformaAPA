'use client';

import { useState, useEffect } from 'react';
import TerminosModal from '@/components/ui/TerminosModal';

/**
 * Componente cliente que verifica si el usuario aceptó los T&C.
 * Si no los aceptó, muestra el modal bloqueante.
 * Se incluye en el layout del dashboard.
 */
export default function TerminosChecker() {
  const [checked, setChecked] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/terminos')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setChecked(true);
        if (!data.aceptado) {
          setMostrarModal(true);
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
      onAceptar={() => setMostrarModal(false)}
    />
  );
}
