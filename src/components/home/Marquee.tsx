import { SectionEyebrow } from '../SectionEyebrow'
import { partners } from '../../data/mock/partners'

/**
 * Partner wordmarks, scrolling continuously on the warm-black band.
 *
 * Two identical groups sit side by side and the track translates -50%, so the
 * second group is exactly where the first started when the loop restarts.
 * The trailing pr-24 on each group matters: with a single flex row and one
 * shared gap, half the width lands half a gap short and the loop visibly jumps.
 *
 * Pause-on-hover and the reduced-motion override live in src/index.css on
 * .marquee-track.
 */
export function Marquee() {
  const group = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      data-marquee-group={hidden ? 'clone' : 'primary'}
      className="flex shrink-0 items-center gap-24 pr-24"
    >
      {partners.map((partner) => (
        <li
          key={partner}
          data-partner={partner}
          className="whitespace-nowrap font-sans text-[2rem] font-semibold leading-none text-cream"
        >
          {partner}
        </li>
      ))}
    </ul>
  )

  return (
    <section data-section="partners" className="bg-black py-16">
      <div className="container-hive">
        <SectionEyebrow className="text-gold">POWERED BY OUR NETWORK</SectionEyebrow>
      </div>

      {/* overflow-hidden is load-bearing: without it the doubled track widens
          the document and every page gets a horizontal scrollbar. */}
      <div className="mt-8 overflow-hidden">
        <div className="marquee-track flex w-max animate-marquee">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  )
}
