// Script para ejecutar el seed de voluntarios en Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno manualmente desde .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const env = {};
  envContent.split('\n').forEach(line => {
    // Ignorar comentarios y líneas vacías
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
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ejecutarSeed() {
  try {
    console.log('🚀 Insertando voluntarios de prueba...');

    // 1. Crear perfiles de voluntarios (sin tocar auth.users por ahora)
    const voluntarios = [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        rol: 'voluntario',
        metadata: {
          nombre_completo: 'María García',
          telefono: '11-1111-1111',
          disponibilidad: 'lunes y miércoles'
        }
      },
      {
        id: 'b2222222-2222-2222-2222-222222222222',
        rol: 'voluntario',
        metadata: {
          nombre_completo: 'Juan Pérez',
          telefono: '11-2222-2222',
          disponibilidad: 'martes y jueves'
        }
      },
      {
        id: 'c3333333-3333-3333-3333-333333333333',
        rol: 'voluntario',
        metadata: {
          nombre_completo: 'Ana Rodríguez',
          telefono: '11-3333-3333',
          disponibilidad: 'lunes a viernes'
        }
      },
      {
        id: 'd4444444-4444-4444-4444-444444444444',
        rol: 'voluntario',
        metadata: {
          nombre_completo: 'Carlos López',
          telefono: '11-4444-4444',
          disponibilidad: 'sábados'
        }
      }
    ];

    for (const vol of voluntarios) {
      const { error } = await supabase
        .from('perfiles')
        .upsert(vol, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error insertando ${vol.metadata.nombre_completo}:`, error);
      } else {
        console.log(`✅ ${vol.metadata.nombre_completo} insertado`);
      }
    }

    // 2. Crear plantilla de autoevaluación
    console.log('\n📝 Insertando plantilla de autoevaluación...');
    const { error: errorPlantilla } = await supabase
      .from('plantillas_autoevaluacion')
      .upsert({
        id: 'e0000000-0000-0000-0000-000000000001',
        titulo: 'Autoevaluación de Habilidades (Test Matching)',
        area: 'lenguaje',
        descripcion: 'Plantilla de prueba para evaluar habilidades de voluntarios',
        activo: true,
        preguntas: [
          {
            id: 'p1',
            texto: '¿Cómo evaluás tu capacidad para trabajar vocabulario y comprensión oral?',
            tipo: 'escala_1_5',
            area: 'lenguaje',
            requerida: true
          },
          {
            id: 'p2',
            texto: '¿Qué tan cómodo/a te sentís enseñando ejercicios de motricidad fina?',
            tipo: 'escala_1_5',
            area: 'grafismo',
            requerida: true
          },
          {
            id: 'p3',
            texto: '¿Cómo calificarías tu habilidad para enseñar lectura y escritura?',
            tipo: 'escala_1_5',
            area: 'lectura_escritura',
            requerida: true
          },
          {
            id: 'p4',
            texto: '¿Qué tan seguro/a te sentís enseñando nociones matemáticas básicas?',
            tipo: 'escala_1_5',
            area: 'matematicas',
            requerida: true
          }
        ]
      }, { onConflict: 'id' });

    if (errorPlantilla) {
      console.error('❌ Error insertando plantilla:', errorPlantilla);
    } else {
      console.log('✅ Plantilla insertada');
    }

    // 3. Crear respuestas de autoevaluación
    console.log('\n📋 Insertando autoevaluaciones...');
    const respuestas = [
      {
        id: 'f1111111-0000-0000-0000-000000000001',
        plantilla_id: 'e0000000-0000-0000-0000-000000000001',
        voluntario_id: 'a1111111-1111-1111-1111-111111111111',
        respuestas: [
          { pregunta_id: 'p1', respuesta: 5, area: 'lenguaje' },
          { pregunta_id: 'p2', respuesta: 3, area: 'grafismo' },
          { pregunta_id: 'p3', respuesta: 5, area: 'lectura_escritura' },
          { pregunta_id: 'p4', respuesta: 2, area: 'matematicas' }
        ],
        estado: 'evaluada',
        puntaje_automatico: 3.75,
        fecha_completada: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'f2222222-0000-0000-0000-000000000002',
        plantilla_id: 'e0000000-0000-0000-0000-000000000001',
        voluntario_id: 'b2222222-2222-2222-2222-222222222222',
        respuestas: [
          { pregunta_id: 'p1', respuesta: 2, area: 'lenguaje' },
          { pregunta_id: 'p2', respuesta: 5, area: 'grafismo' },
          { pregunta_id: 'p3', respuesta: 3, area: 'lectura_escritura' },
          { pregunta_id: 'p4', respuesta: 5, area: 'matematicas' }
        ],
        estado: 'evaluada',
        puntaje_automatico: 3.75,
        fecha_completada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'f3333333-0000-0000-0000-000000000003',
        plantilla_id: 'e0000000-0000-0000-0000-000000000001',
        voluntario_id: 'c3333333-3333-3333-3333-333333333333',
        respuestas: [
          { pregunta_id: 'p1', respuesta: 4, area: 'lenguaje' },
          { pregunta_id: 'p2', respuesta: 4, area: 'grafismo' },
          { pregunta_id: 'p3', respuesta: 4, area: 'lectura_escritura' },
          { pregunta_id: 'p4', respuesta: 4, area: 'matematicas' }
        ],
        estado: 'evaluada',
        puntaje_automatico: 4.0,
        fecha_completada: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'f4444444-0000-0000-0000-000000000004',
        plantilla_id: 'e0000000-0000-0000-0000-000000000001',
        voluntario_id: 'd4444444-4444-4444-4444-444444444444',
        respuestas: [
          { pregunta_id: 'p1', respuesta: 2, area: 'lenguaje' },
          { pregunta_id: 'p2', respuesta: 2, area: 'grafismo' },
          { pregunta_id: 'p3', respuesta: 2, area: 'lectura_escritura' },
          { pregunta_id: 'p4', respuesta: 2, area: 'matematicas' }
        ],
        estado: 'evaluada',
        puntaje_automatico: 2.0,
        fecha_completada: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const resp of respuestas) {
      const { error } = await supabase
        .from('respuestas_autoevaluacion')
        .upsert(resp, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error insertando autoevaluación para ${resp.voluntario_id}:`, error);
      } else {
        console.log(`✅ Autoevaluación insertada (score: ${resp.puntaje_automatico})`);
      }
    }

    console.log('\n✅ Seed completado exitosamente');

    // Verificar los datos insertados
    console.log('\n📊 Verificando voluntarios insertados...');
    const { data: voluntariosInsertados, error: errorVol } = await supabase
      .from('perfiles')
      .select('id, metadata')
      .eq('rol', 'voluntario')
      .in('id', [
        'a1111111-1111-1111-1111-111111111111',
        'b2222222-2222-2222-2222-222222222222',
        'c3333333-3333-3333-3333-333333333333',
        'd4444444-4444-4444-4444-444444444444'
      ]);

    if (errorVol) {
      console.error('❌ Error verificando voluntarios:', errorVol);
    } else {
      console.log(`✅ ${voluntariosInsertados.length} voluntarios encontrados:`);
      voluntariosInsertados.forEach(v => {
        console.log(`   - ${v.id}: ${v.metadata?.nombre_completo || 'Sin nombre'}`);
      });
    }

    console.log('\n📊 Verificando autoevaluaciones...');
    const { data: respuestasInsertadas, error: errorResp } = await supabase
      .from('respuestas_autoevaluacion')
      .select('id, voluntario_id, estado, puntaje_automatico')
      .eq('estado', 'evaluada');

    if (errorResp) {
      console.error('❌ Error verificando autoevaluaciones:', errorResp);
    } else {
      console.log(`✅ ${respuestasInsertadas.length} autoevaluaciones encontradas`);
      respuestasInsertadas.forEach(r => {
        console.log(`   - ${r.voluntario_id}: score ${r.puntaje_automatico}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

ejecutarSeed();
