// Script para crear un usuario coordinador de prueba
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function crearCoordinador() {
  try {
    console.log('👤 Creando usuario coordinador de prueba...\n');
    console.log('🔗 URL:', supabaseUrl);

    // 1. Crear usuario en auth
    console.log('📝 Intentando crear usuario en auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'coordinador@test.com',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Error creando usuario:', authError.message);
      console.error('   Detalles:', authError);
      return;
    }

    console.log('✅ Usuario creado:', authData.user.id);

    // 2. Crear perfil de coordinador
    const { error: perfilError } = await supabase
      .from('perfiles')
      .upsert({
        id: authData.user.id,
        rol: 'coordinador',
        metadata: {
          nombre_completo: 'Coordinador Test',
          telefono: '11-9999-9999'
        }
      });

    if (perfilError) {
      console.error('❌ Error creando perfil:', perfilError.message);
      return;
    }

    console.log('✅ Perfil de coordinador creado');
    console.log('\n📧 Credenciales:');
    console.log('   Email: coordinador@test.com');
    console.log('   Password: password123');
    console.log('\n🎯 Ahora puedes hacer login con estas credenciales');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

crearCoordinador();
