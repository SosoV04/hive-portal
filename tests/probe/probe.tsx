import { createRoot } from 'react-dom/client'
import { Hex } from '../../src/components/Hex'
import { Bee } from '../../src/components/Bee'
import '../../src/index.css'

/**
 * Dev-only component probe.
 *
 * Hex and Bee are primitives whose sanctioned homes arrive in later prompts
 * (avatars in the Directory, the Board's honeycomb Wall). This page mounts
 * them in isolation so the e2e suite can verify their geometry and rendering
 * even while no page happens to use them.
 *
 * It is never built: vite only bundles entries in rollupOptions.input, which
 * is just index.html, so this file and probe.html exist in dev only.
 */

const SIZES = [28, 44, 96, 140] as const
const VARIANTS = ['filled', 'outline', 'photo'] as const

// Inline gold square, so the photo variant needs no network.
const SWATCH =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#8E6F3E"/></svg>')

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-probe={id} style={{ marginBottom: 48 }}>
      <p className="text-caption font-sans font-semibold uppercase text-gold-deep">{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 16 }}>{children}</div>
    </section>
  )
}

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 48 }}>
    {VARIANTS.map((variant) => (
      <Section key={variant} id={`hex-${variant}`} title={`Hex — ${variant}`}>
        {SIZES.map((size) => (
          <Hex
            key={size}
            size={size}
            variant={variant}
            src={SWATCH}
            alt="probe swatch"
            className={`probe-hex probe-hex-${variant}-${size}`}
          >
            <span className="font-display font-black text-black">{size}</span>
          </Hex>
        ))}
      </Section>
    ))}

    <Section id="bee-static" title="Bee — static">
      {[24, 40, 56, 96].map((size) => (
        <Bee key={size} size={size} variant="static" className={`probe-bee probe-bee-static-${size}`} />
      ))}
    </Section>

    <Section id="bee-flying" title="Bee — flying">
      {[24, 40, 56, 96].map((size) => (
        <Bee key={size} size={size} variant="flying" className={`probe-bee probe-bee-flying-${size}`} />
      ))}
    </Section>
  </div>,
)
