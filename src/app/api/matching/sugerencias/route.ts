import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface DeficitNino {
  area: string;
  nivel_gravedad: number; // 1-5 (5 = crítico)
  descripcion: string;
}

interface HabilidadesVoluntario {
  lenguaje: number;
  grafismo: number;
  lectura_escritura: number;
  matematicas: number;
}

interface SugerenciaMatching {
  voluntario_id: string;
  voluntario_nombre: string;
  score: number;
  habilidades: HabilidadesVoluntario;
  asignaciones_actuales: number;
  disponibilidad: 'alta' | 'media' | 'baja';
  detalles_score: {
    score_habilidades: number;
    score_disponibilidad: number;
    score_zona: number;
  };
}

/**
 * Mapeo de áreas entre déficits de niños y habilidades de voluntarios
 */
const MAPEO_AREAS: Record<string, keyof HabilidadesVoluntario> = {
  'lenguaje_vocabulario': 'lenguaje',
  'lenguaje': 'lenguaje',
  'grafismo_motricidad': 'grafismo',
  'grafismo': 'grafismo',
  'lectura_escritura': 'lectura_escritura',
  'lectura': 'lectura_escritura',
  'escritura': 'lectura_escritura',
  'nociones_matematicas': 'matematicas',
  'matematicas': 'matematicas',
  'general': 'lenguaje', // Default a lenguaje si es general
};

/**
 * GET /api/matching/sugerencias?ninoId=xxx
 * Obtiene sugerencias de voluntarios compatibles para un niño
 * Basado en:
 * - Habilidades del voluntario (de autoevaluaciones completadas)
 * - Déficits del niño (de evaluación psicopedagógica)
 * - Carga actual del voluntario
 * - Proximidad de zona (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

    // Verificar autenticación
    let userId = (supabase as any)._authUserId;
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      userId = user.id;
    }

    // Verificar permisos (solo coordinador, psicopedagogía, director)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    if (!['coordinador', 'psicopedagogia', 'director'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para esta operación' },
        { status: 403 }
      );
    }

    // Obtener ninoId del query param
    const { searchParams } = new URL(request.url);
    const ninoId = searchParams.get('ninoId') || searchParams.get('nino_id');

    if (!ninoId) {
      return NextResponse.json(
        { error: 'Falta parámetro ninoId' },
        { status: 400 }
      );
    }

    // 1. Obtener información del niño y sus déficits
    const { data: nino, error: ninoError } = await supabase
      .from('ninos')
      .select('id, alias, zona_id')
      .eq('id', ninoId)
      .single();

    if (ninoError || !nino) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      );
    }

    // Obtener déficits del niño desde historico_deficits
    const { data: deficitsData } = await supabase
      .from('historico_deficits')
      .select('area, nivel_gravedad, descripcion')
      .eq('nino_id', ninoId)
      .is('resuelto_en', null)
      .order('detectado_en', { ascending: false });

    const deficits: DeficitNino[] = (deficitsData || []).map((d: any) => ({
      area: d.area,
      nivel_gravedad: d.nivel_gravedad || 3,
      descripcion: d.descripcion || '',
    }));

    if (deficits.length === 0) {
      return NextResponse.json({
        message: 'El niño no tiene déficits registrados. Realizar evaluación psicopedagógica primero.',
        sugerencias: [],
      });
    }

    // 2. Obtener todos los voluntarios  
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: voluntarios, error: voluntariosError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre, apellido, zona_id')
      .eq('rol', 'voluntario');

    if (voluntariosError) {
      return NextResponse.json(
        { error: 'Error al obtener voluntarios' },
        { status: 500 }
      );
    }

    // 3. Para cada voluntario, obtener su última autoevaluación completada
    const sugerencias: SugerenciaMatching[] = [];

    for (const voluntario of voluntarios || []) {
      // Obtener scores por área del voluntario (replaces respuestas_autoevaluacion)
      const { data: scores, error: scoresError } = await supabase
        .from('scores_voluntarios_por_area')
        .select('area, score_final')
        .eq('voluntario_id', voluntario.id);

      if (scoresError || !scores || scores.length === 0) {
        continue; // Voluntario sin evaluaciones, skip
      }

      // Build habilidades from scores (map area names to HabilidadesVoluntario keys)
      const areaMapping: Record<string, keyof HabilidadesVoluntario> = {
        'lenguaje_vocabulario': 'lenguaje',
        'lenguaje': 'lenguaje',
        'grafismo_motricidad': 'grafismo',
        'grafismo': 'grafismo',
        'lectura_escritura': 'lectura_escritura',
        'nociones_matematicas': 'matematicas',
        'matematicas': 'matematicas',
      };
      const habilidades: HabilidadesVoluntario = { lenguaje: 0, grafismo: 0, lectura_escritura: 0, matematicas: 0 };
      for (const s of scores) {
        const key = areaMapping[s.area];
        if (key) {
          habilidades[key] = (s.score_final || 0) / 20; // 0-100 → 0-5
        }
      }

      // Obtener asignaciones actuales del voluntario
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('asignaciones')
        .select('id')
        .eq('voluntario_id', voluntario.id)
        .eq('activa', true);

      const numAsignaciones = asignaciones?.length || 0;

      // Calcular score de matching
      const score = calcularScoreMatching(
        deficits,
        habilidades,
        numAsignaciones,
        voluntario.zona_id,
        nino.zona_id
      );

      // Determinar disponibilidad
      let disponibilidad: 'alta' | 'media' | 'baja' = 'alta';
      if (numAsignaciones >= 3) disponibilidad = 'baja';
      else if (numAsignaciones >= 2) disponibilidad = 'media';

      const voluntarioNombre = [voluntario.nombre, voluntario.apellido].filter(Boolean).join(' ') || 'Voluntario sin nombre';

      sugerencias.push({
        voluntario_id: voluntario.id,
        voluntario_nombre: voluntarioNombre,
        score: Math.round(score.total),
        habilidades,
        asignaciones_actuales: numAsignaciones,
        disponibilidad,
        detalles_score: {
          score_habilidades: Math.round(score.habilidades),
          score_disponibilidad: Math.round(score.disponibilidad),
          score_zona: Math.round(score.zona),
        },
      });
    }

    // Ordenar por score descendente
    sugerencias.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      nino: {
        id: nino.id,
        alias: nino.alias,
        deficits,
      },
      sugerencias,
      total: sugerencias.length,
    });

  } catch (error) {
    console.error('Error en matching/sugerencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Calcula habilidades promedio por área desde las respuestas
 */
function calcularHabilidadesPorArea(respuestas: any): HabilidadesVoluntario {
  const areasPuntajes: Record<string, number[]> = {
    lenguaje: [],
    grafismo: [],
    lectura_escritura: [],
    matematicas: [],
  };

  // Agrupar respuestas por área
  if (Array.isArray(respuestas)) {
    respuestas.forEach((resp: any) => {
      const area = resp.area?.toLowerCase().replace(/\s+/g, '_');
      const areaKey = MAPEO_AREAS[area];

      if (areaKey && resp.respuesta && typeof resp.respuesta === 'number') {
        areasPuntajes[areaKey].push(resp.respuesta);
      }
    });
  }

  // Calcular promedios
  const habilidades: HabilidadesVoluntario = {
    lenguaje: calcularPromedio(areasPuntajes.lenguaje),
    grafismo: calcularPromedio(areasPuntajes.grafismo),
    lectura_escritura: calcularPromedio(areasPuntajes.lectura_escritura),
    matematicas: calcularPromedio(areasPuntajes.matematicas),
  };

  return habilidades;
}

/**
 * Calcula el score de matching entre déficits del niño y habilidades del voluntario
 */
function calcularScoreMatching(
  deficits: DeficitNino[],
  habilidades: HabilidadesVoluntario,
  numAsignaciones: number,
  zonaVoluntario: string | null,
  zonaNino: string | null
): { total: number; habilidades: number; disponibilidad: number; zona: number } {
  let scoreHabilidades = 0;

  // 1. Score por habilidades (peso: 70%)
  deficits.forEach((deficit) => {
    const area = deficit.area.toLowerCase().replace(/\s+/g, '_');
    const areaKey = MAPEO_AREAS[area];

    if (areaKey) {
      const habilidadVoluntario = habilidades[areaKey];
      const prioridad = deficit.nivel_gravedad; // 1-5

      // Score = habilidad (1-5) * prioridad (1-5) * 2.8 para normalizar a ~70
      scoreHabilidades += habilidadVoluntario * prioridad * 2.8;
    }
  });

  // Normalizar a 70 máximo (si tiene 5 déficits críticos y voluntario 5 estrellas)
  const maxScoreHabilidades = deficits.length * 5 * 5 * 2.8;
  scoreHabilidades = (scoreHabilidades / maxScoreHabilidades) * 70;

  // 2. Score por disponibilidad (peso: 20%)
  let scoreDisponibilidad = 20;
  if (numAsignaciones >= 3) scoreDisponibilidad = 5;  // Sobrecargado
  else if (numAsignaciones === 2) scoreDisponibilidad = 12; // Media carga
  else if (numAsignaciones === 1) scoreDisponibilidad = 16; // Buena carga

  // 3. Score por zona (peso: 10%)
  let scoreZona = 10;
  if (!zonaVoluntario || !zonaNino) {
    scoreZona = 5; // Sin info de zona
  } else if (zonaVoluntario !== zonaNino) {
    scoreZona = 3; // Zona diferente
  }

  const total = scoreHabilidades + scoreDisponibilidad + scoreZona;

  return {
    total,
    habilidades: scoreHabilidades,
    disponibilidad: scoreDisponibilidad,
    zona: scoreZona,
  };
}

/**
 * Calcula promedio de un array de números
 */
function calcularPromedio(numeros: number[]): number {
  if (numeros.length === 0) return 2.5; // Default neutral
  const suma = numeros.reduce((acc, num) => acc + num, 0);
  return suma / numeros.length;
}
