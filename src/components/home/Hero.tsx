import { Button } from '../Button'
import { Hex } from '../Hex'
import { Reveal } from '../Reveal'
import { SectionEyebrow } from '../SectionEyebrow'
import { spotlight } from '../../data/mock/spotlight'

/**
 * Hero — this week's founder.
 *
 * Not a landing-page hero: no tagline, no "welcome to HIVE". The first thing
 * a member sees is a specific person with a specific ask, because the point of
 * the portal is that someone in the room can answer it.
 */
export function Hero() {
  return (
    <section
      data-section="hero"
      className="flex min-h-[88vh] items-center bg-cream py-12 md:py-16"
    >
      <div className="container-hive grid w-full items-center gap-12 lg:grid-cols-[55fr_45fr] lg:gap-16">
        <Reveal>
          <SectionEyebrow>THIS WEEK&apos;S FOUNDER</SectionEyebrow>

          <h1 className="mt-4 font-display text-display-xl font-black text-black opsz-display">
            {spotlight.name}
          </h1>

          <p className="mt-2 text-body-sm uppercase tracking-[0.08em] text-ink/60">
            {spotlight.standing}
          </p>

          <p className="mt-5 max-w-[34ch] font-display text-display-md font-semibold text-ink">
            <span className="text-black">{spotlight.teamName}</span> — {spotlight.teamDescription}
          </p>

          <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {spotlight.prompts.map((prompt) => (
              <div key={prompt.label}>
                <dt className="font-sans text-caption font-semibold uppercase text-gold-deep">
                  {prompt.label}
                </dt>
                <dd className="mt-2 text-body-lg text-ink">{prompt.answer}</dd>
              </div>
            ))}
          </dl>

          <Button className="mt-8" to={`/directory#${spotlight.slug}`}>
            Meet the founder →
          </Button>
        </Reveal>

        <Reveal delay={0.08} className="flex justify-center lg:justify-end">
          {/* The logo hex hangs off the photo's bottom-left corner, so the
              wrapper is sized to the photo and the logo is positioned out. */}
          <div className="relative w-[280px] sm:w-[380px]">
            <Hex
              size={380}
              variant="photo"
              src={spotlight.photoUrl}
              alt={spotlight.photoAlt}
              className="ken-burns w-full"
            />
            <Hex
              size={88}
              variant="filled"
              color="var(--gold-soft)"
              className="absolute -bottom-4 left-4 shadow-sm"
            >
              <span className="font-display text-[1.4rem] font-black leading-none text-gold-deep">
                {spotlight.teamInitials}
              </span>
            </Hex>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
