// Verificar metadata de niños para el matching
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarNinos() {
  console.log('🚀 Iniciando verificación...');
  
  try {
    console.log('📊 Verificando niños con déficits...\n');

    const { data: ninos, error } = await supabase
      .from('ninos')
      .select('id, alias, rango_etario, metadata')
      .in('id', [
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000002',
        '33333333-0000-0000-0000-000000000003',
        '44444444-0000-0000-0000-000000000004'
      ]);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`✅ Encontrados ${ninos?.length || 0} niños\n`);

    ninos.forEach(nino => {
      console.log(`\n🧒 ${nino.alias} (${nino.rango_etario})`);
      console.log(`   ID: ${nino.id}`);
      
      const deficits = nino.metadata?.deficits || [];
      if (deficits.length > 0) {
        console.log(`   ✅ ${deficits.length} déficits registrados:`);
        deficits.forEach(d => {
          console.log(`      - ${d.area}: nivel ${d.nivel_gravedad}/5 - ${d.descripcion}`);
        });
      } else {
        console.log(`   ❌ Sin déficits registrados en metadata`);
      }
    });

    console.log('\n\n✅ Puedes probar el matching en:');
    ninos.forEach(nino => {
      if ((nino.metadata?.deficits || []).length > 0) {
        console.log(`   http://localhost:3001/dashboard/ninos/${nino.id}/asignar-voluntario`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarNinos();
