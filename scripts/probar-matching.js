// Probar el endpoint de matching
const { createClient } = require('@supabase/supabase-js');
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
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();

async function probarMatching() {
  try {
    console.log('🔍 Probando endpoint de matching...\n');
    
    // 1. Autenticar con usuario coordinador
    console.log('🔐 Autenticando...');
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coordinador@test.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Error autenticando:', authError.message);
      return;
    }
    
    const token = authData.session.access_token;
    console.log('✅ Autenticado\n');
    
    // 2. Niño con déficit en lenguaje (Lucía)
    const ninoId = '11111111-0000-0000-0000-000000000001';
    
    console.log(`📍 Testing: http://localhost:3000/api/matching/sugerencias?ninoId=${ninoId}\n`);
    
    const response = await fetch(`http://localhost:3000/api/matching/sugerencias?ninoId=${ninoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Response exitoso:\n');
      console.log(`📊 Niño: ${data.nino.alias}`);
      console.log(`📊 Déficits: ${data.nino.deficits.length}`);
      data.nino.deficits.forEach(d => {
        console.log(`   - ${d.area}: nivel ${d.nivel_gravedad}/5`);
      });
      
      console.log(`\n👥 Sugerencias: ${data.sugerencias.length} voluntarios`);
      
      if (data.sugerencias.length > 0) {
        console.log('\n🏆 Top 3 voluntarios:\n');
        data.sugerencias.slice(0, 3).forEach((sug, i) => {
          console.log(`${i + 1}. ${sug.voluntario_nombre} (Score: ${sug.score}/100)`);
          console.log(`   - Habilidades: L=${sug.habilidades.lenguaje} G=${sug.habilidades.grafismo} LE=${sug.habilidades.lectura_escritura} M=${sug.habilidades.matematicas}`);
          console.log(`   - Disponibilidad: ${sug.disponibilidad} (${sug.asignaciones_actuales} asignaciones)`);
          console.log(`   - Desglose: Hab=${sug.detalles_score.score_habilidades} Disp=${sug.detalles_score.score_disponibilidad} Zona=${sug.detalles_score.score_zona}\n`);
        });
      } else {
        console.log('⚠️ No hay voluntarios disponibles');
      }
      
    } else {
      console.error('❌ Error en el endpoint:');
      console.error(`   Status: ${response.status}`);
      console.error(`   Message: ${data.error || data.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

probarMatching();
