import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarTablasCapacitaciones() {
  console.log('🔍 Verificando tablas del sistema de capacitaciones...\n');
  
  const tablas = [
    'capacitaciones',
    'voluntarios_capacitaciones', 
    'voluntarios_habilidades',
    'asignaciones_voluntarios'
  ];
  
  for (const tabla of tablas) {
    const { count, error } = await supabase
      .from(tabla)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${tabla}: ${error.message}`);
    } else {
      console.log(`✅ ${tabla}: ${count || 0} registros`);
    }
  }
  
  // Verificar funciones
  console.log('\n🔧 Verificando funciones...\n');
  
  const funciones = [
    'actualizar_estrellas_voluntario',
    'calcular_score_matching',
    'sugerir_voluntarios_para_nino'
  ];
  
  for (const func of funciones) {
    const { data, error } = await supabase.rpc(func as any).select();
    
    if (error && !error.message.includes('missing')) {
      console.log(`❌ ${func}: ${error.message}`);
    } else {
      console.log(`✅ ${func}: Existe`);
    }
  }
  
  console.log('\n📊 Mostrando capacitaciones de ejemplo:\n');
  
  const { data: capacitaciones, error: capError } = await supabase
    .from('capacitaciones')
    .select('titulo, area, tipo, puntaje_otorgado')
    .limit(5);
  
  if (capError) {
    console.log('❌ Error consultando capacitaciones:', capError.message);
  } else if (capacitaciones) {
    console.table(capacitaciones);
  }
}

console.log('================================================');
console.log('INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN');
console.log('================================================\n');
console.log('1. Ir a: https://supabase.com/dashboard/project/dntfckzpxcelmrrvcytl/editor');
console.log('2. Abrir el archivo: supabase/migrations/20260118_sistema_capacitacion_voluntarios.sql');
console.log('3. Copiar TODO el contenido');
console.log('4. Ir al SQL Editor en Supabase');
console.log('5. Pegar y ejecutar (Run)\n');
console.log('Luego ejecuta este script nuevamente para verificar.\n');
console.log('================================================\n');

verificarTablasCapacitaciones();
