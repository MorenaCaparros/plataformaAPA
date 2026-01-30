// Script para probar el endpoint POST /api/asignaciones
// Usa el usuario coordinador de prueba
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

// IDs de prueba (del seed)
const NINO_LUCIA_ID = '11111111-0000-0000-0000-000000000001';
const VOLUNTARIO_MARIA_ID = 'a1111111-1111-1111-1111-111111111111';

// Credenciales del coordinador de prueba
const COORDINADOR_EMAIL = 'coordinador@test.com';
const COORDINADOR_PASSWORD = 'password123';

async function login() {
  console.log('🔐 Iniciando sesión como coordinador...');
  
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
  console.log('✅ Login exitoso');
  return data.access_token;
}

async function crearAsignacion(token, ninoId, voluntarioId, scorMatching) {
  console.log(`\n📝 Creando asignación: niño=${ninoId.slice(0,8)}... → voluntario=${voluntarioId.slice(0,8)}...`);
  
  const response = await fetch(`${API_BASE}/api/asignaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nino_id: ninoId,
      voluntario_id: voluntarioId,
      score_matching: scorMatching,
      notas: 'Asignación de prueba creada automáticamente',
      areas_foco: ['lenguaje', 'lectura_escritura']
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.log(`❌ Error ${response.status}: ${data.error}`);
    return null;
  }

  console.log('✅ Asignación creada:', {
    id: data.asignacion?.id,
    score: data.asignacion?.score_matching,
    voluntario: data.asignacion?.voluntario?.metadata?.nombre_completo,
    nino: data.asignacion?.nino?.alias,
    desactivadas: data.asignaciones_desactivadas
  });
  
  return data;
}

async function obtenerAsignaciones(token, ninoId) {
  console.log(`\n📋 Consultando asignaciones del niño ${ninoId.slice(0,8)}...`);
  
  const response = await fetch(`${API_BASE}/api/asignaciones?nino_id=${ninoId}&activo=true`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.log(`❌ Error: ${data.error}`);
    return [];
  }

  console.log(`📊 Total asignaciones activas: ${data.total}`);
  data.asignaciones?.forEach((a, i) => {
    console.log(`  ${i+1}. Voluntario: ${a.voluntario?.metadata?.nombre_completo || 'N/A'} (Score: ${a.score_matching})`);
  });
  
  return data.asignaciones;
}

async function main() {
  try {
    console.log('🧪 === PRUEBA DEL ENDPOINT POST /api/asignaciones ===\n');

    // 1. Login como coordinador
    const token = await login();

    // 2. Consultar asignaciones actuales
    await obtenerAsignaciones(token, NINO_LUCIA_ID);

    // 3. Crear nueva asignación (María García con Lucía, score 88)
    const resultado = await crearAsignacion(token, NINO_LUCIA_ID, VOLUNTARIO_MARIA_ID, 88);

    // 4. Verificar que se creó correctamente
    await obtenerAsignaciones(token, NINO_LUCIA_ID);

    // 5. Intentar crear duplicado (debe fallar)
    console.log('\n🔄 Intentando crear asignación duplicada...');
    await crearAsignacion(token, NINO_LUCIA_ID, VOLUNTARIO_MARIA_ID, 88);

    console.log('\n✅ === PRUEBA COMPLETADA ===');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

main();
