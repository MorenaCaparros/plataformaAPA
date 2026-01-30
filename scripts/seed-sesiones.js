// Script para insertar sesiones de prueba

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dntfckzpxcelmrrvcytl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IDs de referencia
const voluntarios = {
  maria: 'a1111111-1111-1111-1111-111111111111',
  juan: 'b2222222-2222-2222-2222-222222222222',
  ana: 'c3333333-3333-3333-3333-333333333333',
  carlos: 'd4444444-4444-4444-4444-444444444444'
};

const ninos = {
  lucia: '11111111-0000-0000-0000-000000000001',
  mateo: '22222222-0000-0000-0000-000000000002',
  sofia: '33333333-0000-0000-0000-000000000003',
  diego: '44444444-0000-0000-0000-000000000004'
};

// Función para crear items de sesión
function crearItems(valores) {
  return [
    { id: 'AC01', categoria: 'atencion_concentracion', texto: 'Mantiene la atención durante la actividad', valor: valores.ac01 || 3 },
    { id: 'AC02', categoria: 'atencion_concentracion', texto: 'Sigue instrucciones simples', valor: valores.ac02 || 3 },
    { id: 'LE01', categoria: 'lenguaje_expresion', texto: 'Expresa ideas con claridad', valor: valores.le01 || 3 },
    { id: 'LE02', categoria: 'lenguaje_expresion', texto: 'Usa vocabulario adecuado a su edad', valor: valores.le02 || 3 },
    { id: 'LW01', categoria: 'lectura_escritura', texto: 'Reconoce letras del alfabeto', valor: valores.lw01 || 3 },
    { id: 'LW02', categoria: 'lectura_escritura', texto: 'Intenta escribir palabras', valor: valores.lw02 || 3 },
    { id: 'MA01', categoria: 'matematicas', texto: 'Cuenta hasta 10', valor: valores.ma01 || 3 },
    { id: 'GR01', categoria: 'grafismo', texto: 'Agarra el lápiz correctamente', valor: valores.gr01 || 3 }
  ];
}

async function seedSesiones() {
  console.log('🚀 Iniciando seed de sesiones de prueba...\n');

  // Verificar que existen los niños
  const { data: ninosExistentes, error: errorNinos } = await supabase
    .from('ninos')
    .select('id, alias')
    .in('id', Object.values(ninos));

  if (errorNinos) {
    console.error('❌ Error verificando niños:', errorNinos.message);
    return;
  }

  console.log(`✅ Niños encontrados: ${ninosExistentes?.length || 0}`);
  ninosExistentes?.forEach(n => console.log(`   - ${n.alias} (${n.id})`));

  // Verificar que existen los voluntarios
  const { data: voluntariosExistentes, error: errorVol } = await supabase
    .from('perfiles')
    .select('id, metadata')
    .in('id', Object.values(voluntarios))
    .eq('rol', 'voluntario');

  if (errorVol) {
    console.error('❌ Error verificando voluntarios:', errorVol.message);
    return;
  }

  console.log(`✅ Voluntarios encontrados: ${voluntariosExistentes?.length || 0}`);
  voluntariosExistentes?.forEach(v => console.log(`   - ${v.metadata?.nombre_completo || 'Sin nombre'} (${v.id})`));

  if ((ninosExistentes?.length || 0) === 0 || (voluntariosExistentes?.length || 0) === 0) {
    console.error('\n❌ No hay datos base. Ejecuta primero el seed de matching.');
    return;
  }

  // Crear sesiones
  const sesiones = [];
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  // María García (muy activa) con Lucía - 6 sesiones este mes
  const fechasMaria = [5, 8, 12, 15, 22, 29];
  fechasMaria.forEach((dia, i) => {
    const fecha = new Date(inicioMes);
    fecha.setDate(dia);
    fecha.setHours(10, 0, 0, 0);
    
    // Progreso gradual
    const progreso = Math.min(2 + Math.floor(i * 0.5), 5);
    
    sesiones.push({
      nino_id: ninos.lucia,
      voluntario_id: voluntarios.maria,
      fecha: fecha.toISOString(),
      duracion_minutos: 40 + Math.floor(Math.random() * 20),
      items: crearItems({
        ac01: 3 + Math.min(i, 2),
        ac02: 4,
        le01: 2 + Math.min(i, 2),
        le02: 2 + Math.min(i, 2),
        lw01: 2 + Math.min(i, 2),
        lw02: 1 + Math.min(i, 3),
        ma01: 3 + Math.min(i, 2),
        gr01: 3 + Math.min(i, 2)
      }),
      observaciones_libres: `Sesión ${i + 1} con Lucía. ${i > 3 ? 'Excelente progreso!' : 'Trabajando en vocabulario.'}`,
      created_offline: false
    });
  });

  // Juan Pérez con Mateo - 4 sesiones
  const fechasJuan = [6, 13, 20, 27];
  fechasJuan.forEach((dia, i) => {
    const fecha = new Date(inicioMes);
    fecha.setDate(dia);
    fecha.setHours(14, 0, 0, 0);
    
    sesiones.push({
      nino_id: ninos.mateo,
      voluntario_id: voluntarios.juan,
      fecha: fecha.toISOString(),
      duracion_minutos: 45 + Math.floor(Math.random() * 15),
      items: crearItems({
        ac01: 4 + Math.min(i, 1),
        ac02: 4 + Math.min(i, 1),
        le01: 4,
        le02: 4,
        lw01: 4 + Math.min(i, 1),
        lw02: 3 + Math.min(i, 1),
        ma01: 2 + Math.min(i, 1), // Mejora lenta en matemáticas
        gr01: 2 + Math.min(i, 2)
      }),
      observaciones_libres: `Sesión ${i + 1} con Mateo. Trabajando matemáticas con juegos.`,
      created_offline: false
    });
  });

  // Ana Rodríguez con Sofía - 3 sesiones
  const fechasAna = [7, 14, 28];
  fechasAna.forEach((dia, i) => {
    const fecha = new Date(inicioMes);
    fecha.setDate(dia);
    fecha.setHours(16, 0, 0, 0);
    
    sesiones.push({
      nino_id: ninos.sofia,
      voluntario_id: voluntarios.ana,
      fecha: fecha.toISOString(),
      duracion_minutos: 40 + Math.floor(Math.random() * 15),
      items: crearItems({
        ac01: 3 + Math.min(i, 1),
        ac02: 3 + Math.min(i, 1),
        le01: 3 + Math.min(i, 1),
        le02: 3,
        lw01: 3 + Math.min(i, 1),
        lw02: 2 + Math.min(i, 1),
        ma01: 3 + Math.min(i, 1),
        gr01: 3 + Math.min(i, 1)
      }),
      observaciones_libres: `Sesión ${i + 1} con Sofía. Progreso uniforme en todas las áreas.`,
      created_offline: false
    });
  });

  // Sesiones de diciembre (mes anterior) para tendencias
  const mesAnterior = new Date(inicioMes);
  mesAnterior.setMonth(mesAnterior.getMonth() - 1);

  // María con Lucía en diciembre (4 sesiones)
  [5, 12, 19, 26].forEach((dia, i) => {
    const fecha = new Date(mesAnterior);
    fecha.setDate(dia);
    fecha.setHours(10, 0, 0, 0);
    
    sesiones.push({
      nino_id: ninos.lucia,
      voluntario_id: voluntarios.maria,
      fecha: fecha.toISOString(),
      duracion_minutos: 45,
      items: crearItems({
        ac01: 2,
        ac02: 3,
        le01: 2,
        le02: 2,
        lw01: 2,
        lw02: 1,
        ma01: 2,
        gr01: 2
      }),
      observaciones_libres: `Sesión de diciembre ${i + 1} con Lucía.`,
      created_offline: false
    });
  });

  // Juan con Mateo en diciembre (2 sesiones)
  [10, 17].forEach((dia, i) => {
    const fecha = new Date(mesAnterior);
    fecha.setDate(dia);
    fecha.setHours(14, 0, 0, 0);
    
    sesiones.push({
      nino_id: ninos.mateo,
      voluntario_id: voluntarios.juan,
      fecha: fecha.toISOString(),
      duracion_minutos: 50,
      items: crearItems({
        ac01: 3,
        ac02: 4,
        le01: 4,
        le02: 4,
        lw01: 4,
        lw02: 3,
        ma01: 2,
        gr01: 2
      }),
      observaciones_libres: `Sesión de diciembre ${i + 1} con Mateo.`,
      created_offline: false
    });
  });

  console.log(`\n📝 Insertando ${sesiones.length} sesiones...`);

  // Insertar en lotes para evitar errores
  const batchSize = 10;
  let insertadas = 0;
  let errores = 0;

  for (let i = 0; i < sesiones.length; i += batchSize) {
    const batch = sesiones.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('sesiones')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Error en lote ${i / batchSize + 1}:`, error.message);
      errores += batch.length;
    } else {
      insertadas += data?.length || 0;
      console.log(`   ✅ Lote ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} sesiones`);
    }
  }

  console.log(`\n✅ Sesiones insertadas: ${insertadas}`);
  if (errores > 0) console.log(`❌ Errores: ${errores}`);

  // Crear asignaciones si no existen
  console.log('\n📋 Verificando asignaciones...');
  
  const asignaciones = [
    { voluntario_id: voluntarios.maria, nino_id: ninos.lucia, motivo: 'Alta compatibilidad en lenguaje' },
    { voluntario_id: voluntarios.juan, nino_id: ninos.mateo, motivo: 'Alta compatibilidad en matemáticas' },
    { voluntario_id: voluntarios.ana, nino_id: ninos.sofia, motivo: 'Perfil balanceado' }
  ];

  for (const asig of asignaciones) {
    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('asignaciones')
      .select('id')
      .eq('voluntario_id', asig.voluntario_id)
      .eq('nino_id', asig.nino_id)
      .eq('activo', true)
      .single();

    if (!existente) {
      const { error } = await supabase
        .from('asignaciones')
        .insert({
          voluntario_id: asig.voluntario_id,
          nino_id: asig.nino_id,
          fecha_asignacion: mesAnterior.toISOString().split('T')[0],
          activo: true,
          motivo_asignacion: asig.motivo
        });

      if (error) {
        console.error(`   ❌ Error creando asignación: ${error.message}`);
      } else {
        console.log(`   ✅ Asignación creada`);
      }
    } else {
      console.log(`   ℹ️ Asignación ya existe`);
    }
  }

  // Mostrar resumen final
  console.log('\n📊 Verificando datos finales...');
  
  const { count: totalSesiones } = await supabase
    .from('sesiones')
    .select('*', { count: 'exact', head: true });
  
  const { data: sesionesPorVoluntario } = await supabase
    .from('sesiones')
    .select('voluntario_id')
    .gte('fecha', inicioMes.toISOString());

  const conteo = {};
  sesionesPorVoluntario?.forEach(s => {
    conteo[s.voluntario_id] = (conteo[s.voluntario_id] || 0) + 1;
  });

  console.log(`\n📈 RESUMEN FINAL:`);
  console.log(`   Total sesiones en DB: ${totalSesiones}`);
  console.log(`   Sesiones este mes por voluntario:`);
  console.log(`   - María García: ${conteo[voluntarios.maria] || 0} sesiones`);
  console.log(`   - Juan Pérez: ${conteo[voluntarios.juan] || 0} sesiones`);
  console.log(`   - Ana Rodríguez: ${conteo[voluntarios.ana] || 0} sesiones`);
  console.log(`   - Carlos López: ${conteo[voluntarios.carlos] || 0} sesiones (inactivo)`);
  
  console.log('\n✨ Seed de sesiones completado!');
  console.log('   Ahora puedes probar la página de métricas en /dashboard/metricas');
}

seedSesiones().catch(console.error);
