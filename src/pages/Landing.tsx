import { Layout } from '../components/Layout'

export function Landing() {
  return (
    <Layout>
      <div className="hero">
        <p className="hero-eyebrow">Infra.Coop</p>
        <h1>¿Qué es <em>Infra.Coop</em>?</h1>
      </div>

      <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--ink-mid)', maxWidth: 680 }}>
        <p style={{ marginBottom: '1.25rem', color: 'var(--ink)', fontSize: 16 }}>
          Infra.Coop es la dimensión tecnosocial de Data Cooperativas Latinas. Es una infraestructura digital inclusiva basada en los conceptos y modelo de gobernanza de datos cooperativos que encontrarás en el sitio.
        </p>

        <p style={{ marginBottom: '.5rem', fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>Monitor de Brechas</p>
        <p style={{ marginBottom: '1.25rem' }}>
          El propósito es evidenciar el rol que juegan las preguntas —la fase de problema— al momento de iniciar un proceso de recolección de datos. Qué nos preguntemos, cómo y para quién incide en qué datos se definen recolectar. Esto mismo sucede cuando una Oficina Nacional de Estadísticas o un área de gobierno se propone diseñar un proyecto de datos.
        </p>
        <p style={{ marginBottom: '1.25rem' }}>
          Con la PREGUNTA nos interesa enfatizar en la urgencia, pertinencia y oportunidad de los datos cooperativos —datos ciudadanos— para contar con los DATOS QUE QUEREMOS.
        </p>

        <p style={{ marginBottom: '.5rem', fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>Monitor Colectivo</p>
        <p style={{ marginBottom: '.75rem' }}>
          Tu pregunta contribuye para crear la evidencia común del estado de los datos de género. En principio contrastando tu pregunta con dos bases de datos seleccionadas para Infra.Coop:
        </p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>a) Datasets de género regionales</p>
        <p style={{ marginBottom: '1.25rem', paddingLeft: '1rem' }}>
          b) Marcos de normativas vigentes a nivel global, regional y nacional. Criterios: normativas de datos, de tecnologías y de género.
        </p>
        <p style={{ marginBottom: '1.25rem' }}>
          A medida que se sumen más preguntas, se irá visualizando la diferencia entre la brecha de datos existente (con los datos que tenemos y las normativas actuales) vs la brecha real.
        </p>

        <p style={{ marginBottom: '.5rem', fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>Los datos que queremos</p>
        <p style={{ marginBottom: '1.25rem' }}>
          En este apartado es donde el algoritmo cooperativo llega a su meta (al menos por ahora). La lupa está ahora puesta en la evolución entre los datos que tenemos y los datos que queremos.
        </p>

        <p style={{ marginBottom: '.75rem', fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>¿Qué tenemos en proceso?</p>
        <p style={{ marginBottom: '.75rem' }}>
          La Capa de Monitor es la primera prototipada. Hemos ideado para implementar a futuro las siguientes:
        </p>

        <p style={{ marginBottom: '.4rem', color: 'var(--accent)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>* Capa federada de nodos</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>Un foro y comunidad de aprendizaje cooperativo.</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>Exploración de las intervenciones del modelo de gobernanza para la incidencia en distintos espacios territoriales y temáticos.</p>
        <p style={{ marginBottom: '1.25rem', paddingLeft: '1rem' }}>Aplicación de metodologías del Ciclo de Datos que queremos por temática y nodos.</p>

        <p style={{ marginBottom: '.4rem', color: 'var(--accent)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>* Capa de datos cooperativos</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>Espacio seguro y cuidado para archivar tus datos ciudadanos.</p>
        <p style={{ marginBottom: '1.25rem', paddingLeft: '1rem' }}>Este elemento contará con distintos niveles de acceso por roles y/o criterios de gobernanza del Protocolo.</p>

        <p style={{ marginBottom: '1.25rem', color: 'var(--accent)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--mono)', letterSpacing: '.04em' }}>* Protocolo de gobernanza de la Infra.Coop</p>

        <p style={{ marginBottom: '.75rem', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Otras ideas que queremos trabajar a futuro con tu ayuda</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>— Simulador de intervenciones en el ciclo de datos de tu elección (OSC)</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>— Explorador de diagnósticos de incidencia para OSC, funcionarios públicos, organismos y activistas</p>
        <p style={{ marginBottom: '.4rem', paddingLeft: '1rem' }}>— Sistematizador de evidencia: útil para áreas de litigio estratégico</p>
        <p style={{ marginBottom: 0, paddingLeft: '1rem' }}>— Creación de cuenta en la plataforma</p>
      </div>
    </Layout>
  )
}
