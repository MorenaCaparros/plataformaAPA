/**
 * Script para generar datos de prueba en la base de datos
 * Ejecutar con: npx tsx scripts/seed-advanced-data.ts
 * 
 * Requiere:
 * - npm install -D tsx
 * - Variables de entorno configuradas en .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/supabase/database.types';

// Configuración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  console.error('Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// IDs de usuarios (deben coincidir con los del seed SQL)
const IDS = {
  psicopedagogia: '00000000-0000-0000-0000-000000000002',
  trabajadoraSocial: '00000000-0000-0000-0000-000000000003',
  coordinadorNorte: '00000000-0000-0000-0000-000000000010',
  coordinadorSur: '00000000-0000-0000-0000-000000000011',
};

// Función helper para fecha aleatoria en rango
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Función helper para valor aleatorio de array
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// 1. EVALUACIONES INICIALES (Psicopedagogía)
// ============================================
async function crearEvaluacionesIniciales() {
  console.log('\n📋 Creando evaluaciones iniciales...');

  // Obtener algunos niños
  const { data: ninos, error } = await supabase
    .from('ninos')
    .select('id, nombre, apellido, rango_etario')
    .limit(15);

  if (error || !ninos) {
    console.error('Error obteniendo niños:', error);
    return;
  }

  const evaluaciones = ninos.map((nino: { id: string; nombre: string; apellido: string; rango_etario: string }) => {
    const edad = nino.rango_etario === '5-7' ? 6 : nino.rango_etario === '8-10' ? 9 : 12;
    
    return {
      nino_id: nino.id,
      evaluador_id: IDS.psicopedagogia,
      fecha_evaluacion: randomDate(new Date('2025-10-01'), new Date('2025-12-31')),
      
      // Lenguaje y Vocabulario
      comprension_ordenes: Math.floor(Math.random() * 3) + 2,
      identificacion_objetos: Math.floor(Math.random() * 3) + 2,
      formacion_oraciones: Math.floor(Math.random() * 3) + 2,
      pronunciacion: Math.floor(Math.random() * 3) + 2,
      notas_lenguaje: randomChoice([
        'Vocabulario acorde a su edad',
        'Dificultades en la pronunciación de algunas consonantes',
        'Buen desarrollo del lenguaje oral',
        'Vocabulario limitado, requiere estimulación'
      ]),

      // Grafismo y Motricidad
      agarre_lapiz: randomChoice(['correcto', 'en_desarrollo', 'incorrecto']),
      tipo_trazo: randomChoice(['firme', 'irregular', 'tenue']),
      representacion_figuras: Math.floor(Math.random() * 3) + 2,
      notas_grafismo: randomChoice([
        'Buena coordinación visomotora',
        'Requiere ejercicios de motricidad fina',
        'Trazo firme pero con dificultades en figuras complejas'
      ]),

      // Lectoescritura
      reconocimiento_vocales: Math.floor(Math.random() * 3) + 2,
      reconocimiento_consonantes: Math.floor(Math.random() * 3) + 2,
      identificacion_silabas: Math.floor(Math.random() * 3) + 2,
      lectura_palabras: edad >= 8 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      lectura_textos: edad >= 9 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      escritura_nombre: Math.floor(Math.random() * 3) + 2,
      escritura_palabras: edad >= 8 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      escritura_oraciones: edad >= 9 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      comprension_lectora: edad >= 8 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      notas_lectoescritura: randomChoice([
        'Nivel acorde a su escolaridad',
        'Desfase de 1 año respecto a su grado',
        'Excelente predisposición para la lectura',
        'Requiere refuerzo intensivo en escritura'
      ]),

      // Matemáticas
      conteo: Math.floor(Math.random() * 3) + 2,
      reconocimiento_numeros: Math.floor(Math.random() * 3) + 2,
      suma_resta: edad >= 8 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      resolucion_problemas: edad >= 9 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1,
      notas_matematica: randomChoice([
        'Buen razonamiento lógico',
        'Dificultades en cálculo mental',
        'Comprende bien los problemas pero comete errores en operaciones'
      ]),

      // Dificultades y Fortalezas
      dificultades_identificadas: randomChoice([
        ['atencion', 'concentracion'],
        ['lectura', 'escritura'],
        ['matematica'],
        ['lenguaje_expresivo'],
        ['motricidad_fina'],
        []
      ]),
      fortalezas_identificadas: randomChoice([
        ['motivacion', 'participacion'],
        ['lectura', 'comprension'],
        ['razonamiento_logico'],
        ['creatividad', 'expresion'],
        ['trabajo_en_equipo']
      ]),

      observaciones_generales: randomChoice([
        'Niño con buena predisposición, requiere acompañamiento sistemático.',
        'Se observa desfase respecto a su grupo de pares. Plan de intervención inmediato.',
        'Excelente progreso en los últimos meses. Continuar con el acompañamiento.',
        'Presenta dificultades específicas que requieren evaluación complementaria.'
      ]),

      recomendaciones: randomChoice([
        'Continuar con apoyo escolar 2 veces por semana. Enfoque en lectoescritura.',
        'Derivar a fonoaudiología para evaluación complementaria.',
        'Reforzar ejercicios de motricidad fina. Actividades lúdicas de escritura.',
        'Plan intensivo de matemática. Uso de material concreto.'
      ])
    };
  });

  const { data, error: insertError } = await supabase
    .from('evaluaciones_iniciales')
    .insert(evaluaciones)
    .select();

  if (insertError) {
    console.error('❌ Error insertando evaluaciones:', insertError);
  } else {
    console.log(`✅ Creadas ${data?.length || 0} evaluaciones iniciales`);
  }
}

// ============================================
// 2. PLANES DE INTERVENCIÓN
// ============================================
async function crearPlanesIntervencion() {
  console.log('\n📅 Creando planes de intervención...');

  // Obtener evaluaciones
  const { data: evaluaciones } = await supabase
    .from('evaluaciones_iniciales')
    .select('id, nino_id')
    .limit(10);

  if (!evaluaciones) return;

  const planes = evaluaciones.map((evaluacion: { id: string; nino_id: string }) => ({
    nino_id: evaluacion.nino_id,
    evaluacion_id: evaluacion.id,
    psicopedagoga_id: IDS.psicopedagogia,
    fecha_inicio: randomDate(new Date('2025-11-01'), new Date('2025-12-15')),
    fecha_fin_estimada: new Date('2026-07-31'), // Fin de ciclo lectivo
    
    objetivos_anuales: [
      'Alcanzar nivel de lectura fluida acorde a su grado',
      'Desarrollar escritura autónoma de textos cortos',
      'Fortalecer comprensión lectora'
    ],
    objetivos_corto_plazo: [
      'Reconocer todas las consonantes y vocales',
      'Escribir su nombre y apellido sin ayuda',
      'Leer palabras de 2-3 sílabas'
    ],
    
    actividades_sugeridas: [
      {
        nombre: 'Lotería de sílabas',
        area: 'Lectura',
        frecuencia: '2 veces por semana',
        duracion: '15 minutos',
        materiales: ['Tarjetas con sílabas', 'Imágenes']
      },
      {
        nombre: 'Dictado de palabras',
        area: 'Escritura',
        frecuencia: '1 vez por semana',
        duracion: '20 minutos',
        materiales: ['Cuaderno', 'Lápiz']
      },
      {
        nombre: 'Cuentos con preguntas',
        area: 'Comprensión',
        frecuencia: '2 veces por semana',
        duracion: '25 minutos',
        materiales: ['Cuentos infantiles']
      }
    ],
    
    frecuencia_sesiones: Math.random() < 0.7 ? 2 : 3,
    duracion_estimada_meses: 8,
    
    estado: randomChoice(['activo', 'activo', 'activo', 'en_pausa'])
  }));

  const { data, error } = await supabase
    .from('planes_intervencion')
    .insert(planes)
    .select();

  if (error) {
    console.error('❌ Error insertando planes:', error);
  } else {
    console.log(`✅ Creados ${data?.length || 0} planes de intervención`);
  }
}

// ============================================
// 3. SEGUIMIENTOS MENSUALES
// ============================================
async function crearSeguimientosMensuales() {
  console.log('\n📊 Creando seguimientos mensuales...');

  const { data: planes } = await supabase
    .from('planes_intervencion')
    .select('id, nino_id, psicopedagoga_id');

  if (!planes) return;

  const seguimientos = [];
  
  for (const plan of planes) {
    // Generar 2-3 seguimientos por plan (nov, dic, ene)
    const meses = [new Date('2025-11-30'), new Date('2025-12-31'), new Date('2026-01-31')];
    const cantSeguimientos = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < cantSeguimientos; i++) {
      seguimientos.push({
        plan_id: plan.id,
        nino_id: plan.nino_id,
        psicopedagoga_id: plan.psicopedagoga_id,
        fecha_seguimiento: meses[i],
        mes_numero: i + 1,
        
        objetivos_alcanzados: Math.floor(Math.random() * 4),
        objetivos_en_progreso: Math.floor(Math.random() * 3) + 1,
        objetivos_pendientes: Math.floor(Math.random() * 2),
        
        logros_destacados: randomChoice([
          'Comenzó a leer palabras de forma autónoma',
          'Mejora notable en la escritura de su nombre',
          'Mayor seguridad al expresarse oralmente',
          'Progreso significativo en comprensión de textos'
        ]),
        
        dificultades_observadas: randomChoice([
          'Aún presenta inversión de letras (b-d, p-q)',
          'Se distrae con facilidad durante las actividades',
          'Frustración ante tareas complejas',
          'Ninguna dificultad significativa'
        ]),
        
        ajustes_necesarios: randomChoice([
          'Incrementar ejercicios de motricidad fina',
          'Incluir más actividades lúdicas',
          'Reducir tiempo de sesión por fatiga',
          'Sin ajustes, continuar con plan actual'
        ]),
        
        asistencia_mes: Math.floor(Math.random() * 4) + 6,
        sesiones_planificadas: 8,
        
        observaciones: 'Progreso constante y sostenido. Familia comprometida con el proceso.'
      });
    }
  }

  const { data, error } = await supabase
    .from('seguimientos_mensuales')
    .insert(seguimientos)
    .select();

  if (error) {
    console.error('❌ Error insertando seguimientos:', error);
  } else {
    console.log(`✅ Creados ${data?.length || 0} seguimientos mensuales`);
  }
}

// ============================================
// 4. ENTREVISTAS FAMILIARES (Trabajo Social)
// ============================================
async function crearEntrevistasFamiliares() {
  console.log('\n👨‍👩‍👧‍👦 Creando entrevistas familiares...');

  const { data: ninos } = await supabase
    .from('ninos')
    .select('id, nombre, apellido')
    .limit(20);

  if (!ninos) return;

  const entrevistas = ninos.map((nino: { id: string; nombre: string; apellido: string }) => {
    const edadMadre = Math.floor(Math.random() * 15) + 25;
    const edadPadre = edadMadre + Math.floor(Math.random() * 5);
    const cantHermanos = Math.floor(Math.random() * 4);
    
    return {
      nino_id: nino.id,
      trabajador_social_id: IDS.trabajadoraSocial,
      fecha_entrevista: randomDate(new Date('2025-10-01'), new Date('2025-12-31')),
      tipo_entrevista: randomChoice(['inicial', 'inicial', 'seguimiento']),
      lugar_entrevista: randomChoice(['domicilio', 'escuela', 'sede']),
      
      personas_presentes: [
        { nombre: 'Madre', relacion: 'madre', edad: edadMadre },
        ...(Math.random() < 0.7 ? [{ nombre: 'Padre', relacion: 'padre', edad: edadPadre }] : []),
        ...(Math.random() < 0.3 ? [{ nombre: 'Abuela', relacion: 'abuela', edad: edadMadre + 25 }] : [])
      ],
      
      // Embarazo
      alimentacion_embarazo: randomChoice([
        'Normal, con seguimiento médico',
        'Deficiente por falta de recursos',
        'Buena alimentación durante todo el embarazo'
      ]),
      controles_prenatales: Math.random() < 0.8,
      complicaciones_embarazo: randomChoice([
        '',
        'Anemia leve',
        'Hipertensión gestacional',
        'Parto prematuro (8 meses)'
      ]),
      
      // Alimentación actual
      alimentacion_actual: randomChoice([
        'Desayuno: leche y pan. Almuerzo: guiso o fideos. Merienda: mate cocido. Cena: similar al almuerzo',
        'Comidas completas con variedad de alimentos',
        'Alimentación irregular, depende de lo que haya disponible'
      ]),
      comidas_diarias: randomChoice([2, 3, 3, 4]),
      calidad_alimentacion: randomChoice(['buena', 'regular', 'regular', 'deficiente']),
      notas_alimentacion: randomChoice([
        'Familia recibe asistencia alimentaria',
        'Sin dificultades en este aspecto',
        'Irregular según disponibilidad económica'
      ]),
      
      // Escolaridad
      asiste_escuela: Math.random() < 0.9,
      nombre_escuela: randomChoice([
        'Escuela Primaria N°5',
        'Escuela Primaria N°12',
        'Escuela Primaria N°20',
        'Escuela Primaria N°35'
      ]),
      grado_actual: randomChoice(['1°', '2°', '3°', '4°']),
      asistencia_regular: Math.random() < 0.7,
      dificultades_escolares: randomChoice([
        'Ninguna reportada',
        'Problemas de conducta en el aula',
        'Dificultades de aprendizaje',
        'Ausentismo frecuente'
      ]),
      
      // Vivienda
      composicion_familiar: {
        adultos: Math.floor(Math.random() * 3) + 1,
        ninos: cantHermanos + 1,
        otros: Math.random() < 0.3 ? 1 : 0,
        total: null // se calculará
      },
      tipo_vivienda: randomChoice(['casa', 'departamento', 'precaria']),
      vivienda_propia: Math.random() < 0.4,
      ambientes: Math.floor(Math.random() * 3) + 2,
      agua: Math.random() < 0.9,
      luz: Math.random() < 0.95,
      gas: Math.random() < 0.6,
      cloacas: Math.random() < 0.5,
      condiciones_vivienda: randomChoice(['buenas', 'regulares', 'regulares', 'malas']),
      
      // Situación económica
      trabajo_padre: randomChoice([
        'Construcción (changas)',
        'Empleado de comercio',
        'Desocupado',
        'Cartonero',
        'Chofer de remis'
      ]),
      trabajo_madre: randomChoice([
        'Empleada doméstica',
        'Ama de casa',
        'Venta ambulante',
        'Empleada de limpieza'
      ]),
      ingresos_aproximados: randomChoice(['hasta_50000', '50000_100000', '100000_150000']),
      recibe_asistencia: Math.random() < 0.7,
      tipo_asistencia: randomChoice([
        'AUH',
        'Tarjeta Alimentar',
        'AUH + Tarjeta Alimentar',
        'Plan social municipal'
      ]),
      situacion_economica: randomChoice([
        'Ingresos insuficientes para cubrir necesidades básicas',
        'Situación económica estable con ingresos regulares',
        'Gran vulnerabilidad económica'
      ]),
      
      // Contexto y salud
      contexto_familiar: randomChoice([
        'Familia monoparental. Madre a cargo de 3 hijos. Vive con apoyo de abuela materna.',
        'Familia nuclear completa. Padre trabaja, madre se dedica al hogar.',
        'Situación de violencia doméstica. Intervención previa de servicios locales.',
        'Familia ampliada. Conviven varias generaciones en misma vivienda.'
      ]),
      problemas_salud: randomChoice([
        '',
        'Asma crónica',
        'Problema visual sin tratamiento',
        'Desnutrición leve'
      ]),
      acceso_salud: randomChoice([
        'Hospital público del barrio',
        'PAMI (abuela)',
        'Sin obra social, atiende en salita'
      ]),
      
      situacion_riesgo: Math.random() < 0.2,
      descripcion_riesgo: Math.random() < 0.2 ? 'Situación de violencia familiar detectada' : '',
      
      prioridad_atencion: randomChoice(['baja', 'media', 'media', 'alta']),
      observaciones_generales: randomChoice([
        'Familia comprometida con la educación del niño. Buena predisposición.',
        'Se observa desinterés por parte de los adultos responsables.',
        'Situación compleja que requiere seguimiento cercano.',
        'Contexto favorable para el desarrollo del niño.'
      ]),
      intervenciones_sugeridas: randomChoice([
        'Seguimiento mensual de situación familiar',
        'Derivación a servicios de salud mental',
        'Articulación con servicios de niñez',
        'Acompañamiento educativo intensivo'
      ])
    };
  });

  const { data, error } = await supabase
    .from('entrevistas_familiares')
    .insert(entrevistas)
    .select();

  if (error) {
    console.error('❌ Error insertando entrevistas:', error);
  } else {
    console.log(`✅ Creadas ${data?.length || 0} entrevistas familiares`);
  }
}

// ============================================
// 5. ALERTAS SOCIALES
// ============================================
async function crearAlertasSociales() {
  console.log('\n🚨 Creando alertas sociales...');

  const { data: ninos } = await supabase
    .from('ninos')
    .select('id, nombre, apellido')
    .limit(10);

  if (!ninos) return;

  const alertas = ninos.slice(0, 7).map((nino: { id: string; nombre: string; apellido: string }) => ({
    nino_id: nino.id,
    trabajador_social_id: IDS.trabajadoraSocial,
    tipo_alerta: randomChoice(['ausentismo', 'contexto_familiar', 'salud', 'violencia', 'otro']),
    descripcion: randomChoice([
      'Ausencias reiteradas sin justificación en las últimas 3 semanas',
      'Familia reporta situación de violencia doméstica',
      'Niño presenta signos de desnutrición',
      'Cambio abrupto en el comportamiento del niño',
      'Madre solicita ayuda urgente'
    ]),
    fecha_deteccion: randomDate(new Date('2025-12-01'), new Date('2026-01-07')),
    prioridad: randomChoice(['media', 'alta', 'media', 'critica']),
    estado: randomChoice(['activa', 'activa', 'en_proceso', 'resuelta']),
    acciones_tomadas: randomChoice([
      'Visita domiciliaria realizada. Situación en evaluación.',
      'Derivación a servicios de salud.',
      'Contacto telefónico con familia. Seguimiento programado.',
      'Articulación con servicios locales de protección.'
    ]),
    requiere_derivacion: Math.random() < 0.3,
    derivado_a: Math.random() < 0.3 ? randomChoice(['Servicio Local', 'Hospital', 'Línea 102']) : null,
    proxima_accion: randomChoice([
      'Visita domiciliaria programada para el 15/01',
      'Seguimiento telefónico semanal',
      'Reunión con equipo interdisciplinario',
      'Contacto con escuela'
    ]),
    observaciones: 'Situación requiere monitoreo continuo.'
  }));

  const { data, error } = await supabase
    .from('alertas_sociales')
    .insert(alertas)
    .select();

  if (error) {
    console.error('❌ Error insertando alertas:', error);
  } else {
    console.log(`✅ Creadas ${data?.length || 0} alertas sociales`);
  }
}

// ============================================
// EJECUTAR TODO
// ============================================
async function main() {
  console.log('🚀 Iniciando seed de datos avanzados...\n');
  console.log('⚠️  IMPORTANTE: Ejecutar DESPUÉS del seed SQL básico');
  console.log('===============================================');

  try {
    await crearEvaluacionesIniciales();
    await crearPlanesIntervencion();
    await crearSeguimientosMensuales();
    await crearEntrevistasFamiliares();
    await crearAlertasSociales();

    console.log('\n===============================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('===============================================\n');
    
    // Mostrar resumen
    const resumen = await obtenerResumen();
    console.log('📊 RESUMEN DE DATOS:');
    console.log('-------------------');
    console.log(`Niños: ${resumen.ninos}`);
    console.log(`Sesiones: ${resumen.sesiones}`);
    console.log(`Evaluaciones: ${resumen.evaluaciones}`);
    console.log(`Planes: ${resumen.planes}`);
    console.log(`Seguimientos: ${resumen.seguimientos}`);
    console.log(`Entrevistas: ${resumen.entrevistas}`);
    console.log(`Alertas: ${resumen.alertas}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  }
}

async function obtenerResumen() {
  const [ninos, sesiones, evaluaciones, planes, seguimientos, entrevistas, alertas] = await Promise.all([
    supabase.from('ninos').select('id', { count: 'exact', head: true }),
    supabase.from('sesiones').select('id', { count: 'exact', head: true }),
    supabase.from('evaluaciones_iniciales').select('id', { count: 'exact', head: true }),
    supabase.from('planes_intervencion').select('id', { count: 'exact', head: true }),
    supabase.from('seguimientos_mensuales').select('id', { count: 'exact', head: true }),
    supabase.from('entrevistas_familiares').select('id', { count: 'exact', head: true }),
    supabase.from('alertas_sociales').select('id', { count: 'exact', head: true }),
  ]);

  return {
    ninos: ninos.count || 0,
    sesiones: sesiones.count || 0,
    evaluaciones: evaluaciones.count || 0,
    planes: planes.count || 0,
    seguimientos: seguimientos.count || 0,
    entrevistas: entrevistas.count || 0,
    alertas: alertas.count || 0,
  };
}

// Ejecutar
main();
