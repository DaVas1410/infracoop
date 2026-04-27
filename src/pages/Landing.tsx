import { Layout } from '../components/Layout'

function Section({ eyebrow, title, children }: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ borderTop: '1px solid var(--ink-faint)', paddingTop: '2rem', marginTop: '2rem' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-light)', marginBottom: '.5rem' }}>
        {eyebrow}
      </p>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem,3vw,1.9rem)', lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: '1rem', color: 'var(--ink)' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--ink-mid)', maxWidth: 640 }}>
        {children}
      </div>
    </section>
  )
}

function FutureLayer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent)', letterSpacing: '.04em', marginBottom: '.35rem' }}>
        ✦ {title}
      </p>
      <div style={{ paddingLeft: '1.25rem', fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

export function Landing() {
  return (
    <Layout>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '3rem 1rem 6rem' }}>

        {/* Hero */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--ink-faint)' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-light)', marginBottom: '.75rem' }}>
            Infra.Coop
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,5vw,3rem)', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: '1rem' }}>
            ¿Qué es <em style={{ color: 'var(--accent)' }}>Infra.Coop</em>?
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink)', maxWidth: 600 }}>
            Infra.Coop es la dimensión tecnosocial de Data Cooperativas Latinas. Una infraestructura digital inclusiva basada en los conceptos y modelo de gobernanza de datos cooperativos.
          </p>
        </div>

        {/* Monitor de Brechas */}
        <Section eyebrow="01 · Monitor de Brechas" title="La pregunta como evidencia">
          <p style={{ marginBottom: '1rem' }}>
            El propósito es evidenciar el rol que juegan las preguntas —la fase de problema— al momento de iniciar un proceso de recolección de datos. Qué nos preguntemos, cómo y para quién incide en qué datos se definen recolectar.
          </p>
          <p>
            Con la PREGUNTA nos interesa enfatizar en la urgencia, pertinencia y oportunidad de los datos cooperativos —datos ciudadanos— para contar con los DATOS QUE QUEREMOS.
          </p>
        </Section>

        {/* Monitor Colectivo */}
        <Section eyebrow="02 · Monitor Colectivo" title="El mapa común de brechas">
          <p style={{ marginBottom: '1rem' }}>
            Tu pregunta contribuye a crear la evidencia común del estado de los datos de género, contrastándola con dos bases de datos seleccionadas para Infra.Coop:
          </p>
          <p style={{ marginBottom: '.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--ink-faint)' }}>
            a) Datasets de género regionales
          </p>
          <p style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--ink-faint)' }}>
            b) Marcos de normativas vigentes a nivel global, regional y nacional — normativas de datos, de tecnologías y de género.
          </p>
          <p>
            A medida que se sumen más preguntas, se irá visualizando la diferencia entre la brecha de datos existente versus la brecha real.
          </p>
        </Section>

        {/* Los datos que queremos */}
        <Section eyebrow="03 · ¿Qué datos queremos?" title="Evolución de la demanda colectiva">
          <p>
            En este apartado el algoritmo cooperativo llega a su meta (al menos por ahora). La lupa está puesta en la evolución entre los datos que tenemos y los datos que queremos — seguida semana a semana por pregunta y por agenda.
          </p>
        </Section>

        {/* Futuras capas */}
        <Section eyebrow="En proceso" title="Las capas que vienen">
          <p style={{ marginBottom: '1.5rem' }}>
            La Capa de Monitor es la primera prototipada. Hemos ideado para implementar a futuro:
          </p>

          <FutureLayer title="Capa federada de nodos">
            <p>Un foro y comunidad de aprendizaje cooperativo.</p>
            <p>Exploración de las intervenciones del modelo de gobernanza para la incidencia en distintos espacios territoriales y temáticos.</p>
            <p>Aplicación de metodologías del Ciclo de Datos que queremos por temática y nodos.</p>
          </FutureLayer>

          <FutureLayer title="Capa de datos cooperativos">
            <p>Espacio seguro y cuidado para archivar tus datos ciudadanos.</p>
            <p>Con distintos niveles de acceso por roles y/o criterios de gobernanza del Protocolo.</p>
          </FutureLayer>

          <FutureLayer title="Protocolo de gobernanza de la Infra.Coop">
            <p>El marco normativo interno que rige cómo se toman decisiones sobre los datos cooperativos.</p>
          </FutureLayer>
        </Section>

        {/* Otras ideas */}
        <section style={{ borderTop: '1px solid var(--ink-faint)', paddingTop: '2rem', marginTop: '2rem' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-light)', marginBottom: '1rem' }}>
            Otras ideas — con tu ayuda
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {[
              'Simulador de intervenciones en el ciclo de datos de tu elección (OSC)',
              'Explorador de diagnósticos de incidencia para OSC, funcionarios públicos, organismos y activistas',
              'Sistematizador de evidencia: útil para áreas de litigio estratégico',
              'Creación de cuenta en la plataforma',
            ].map(idea => (
              <p key={idea} style={{ fontSize: 13, color: 'var(--ink-light)', fontFamily: 'var(--mono)', paddingLeft: '1rem', borderLeft: '1px solid var(--ink-faint)' }}>
                — {idea}
              </p>
            ))}
          </div>
        </section>

      </div>
    </Layout>
  )
}
