// Script para probar la desactivación automática de asignaciones anteriores
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const env = {};
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('#') || line === '') return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1].trim()] = value;
    }
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE = 'http://localhost:3000';

// IDs de prueba
const NINO_LUCIA_ID = '11111111-0000-0000-0000-000000000001';
const VOLUNTARIO_JUAN_ID = 'b2222222-2222-2222-2222-222222222222'; // Otro voluntario

// Credenciales del coordinador de prueba
const COORDINADOR_EMAIL = 'coordinador@test.com';
const COORDINADOR_PASSWORD = 'password123';

async function login() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: COORDINADOR_EMAIL,
      password: COORDINADOR_PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Login fallido: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function obtenerAsignaciones(token, ninoId, activo = true) {
  const response = await fetch(`${API_BASE}/api/asignaciones?nino_id=${ninoId}&activo=${activo}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.asignaciones || [];
}

async function crearAsignacion(token, ninoId, voluntarioId, score) {
  const response = await fetch(`${API_BASE}/api/asignaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nino_id: ninoId,
      voluntario_id: voluntarioId,
      score_matching: score,
      notas: 'Prueba de desactivación automática',
      areas_foco: ['matematicas', 'grafismo']
    })
  });
  return response.json();
}

async function main() {
  console.log('🧪 === PRUEBA DE DESACTIVACIÓN AUTOMÁTICA ===\n');

  const token = await login();
  console.log('✅ Login exitoso\n');

  // 1. Ver asignaciones activas actuales
  console.log('📋 Estado actual de Lucía:');
  const activas = await obtenerAsignaciones(token, NINO_LUCIA_ID, true);
  const inactivas = await obtenerAsignaciones(token, NINO_LUCIA_ID, false);
  console.log(`   - Asignaciones activas: ${activas.length}`);
  activas.forEach(a => console.log(`     → ${a.voluntario?.metadata?.nombre_completo} (Score: ${a.score_matching})`));
  console.log(`   - Asignaciones inactivas: ${inactivas.length}`);

  // 2. Asignar NUEVO voluntario (Juan Pérez)
  console.log(`\n📝 Asignando NUEVO voluntario (Juan Pérez) a Lucía...`);
  const resultado = await crearAsignacion(token, NINO_LUCIA_ID, VOLUNTARIO_JUAN_ID, 56);
  
  if (resultado.error) {
    console.log(`❌ Error: ${resultado.error}`);
  } else {
    console.log(`✅ Nueva asignación creada: ${resultado.asignacion?.voluntario?.metadata?.nombre_completo}`);
    console.log(`   - Asignaciones desactivadas automáticamente: ${resultado.asignaciones_desactivadas}`);
  }

  // 3. Verificar estado final
  console.log('\n📋 Estado final de Lucía:');
  const activasFinal = await obtenerAsignaciones(token, NINO_LUCIA_ID, true);
  const inactivasFinal = await obtenerAsignaciones(token, NINO_LUCIA_ID, false);
  console.log(`   - Asignaciones activas: ${activasFinal.length}`);
  activasFinal.forEach(a => console.log(`     → ${a.voluntario?.metadata?.nombre_completo} (Score: ${a.score_matching})`));
  console.log(`   - Asignaciones inactivas: ${inactivasFinal.length}`);
  inactivasFinal.forEach(a => console.log(`     → ${a.voluntario?.metadata?.nombre_completo} (desactivada)`));

  console.log('\n✅ === PRUEBA COMPLETADA ===');
}

main().catch(console.error);
