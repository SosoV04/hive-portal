import { SectionEyebrow } from '../components/SectionEyebrow'

const SECTIONS = [
  {
    id: 'guidelines',
    title: 'Guidelines',
    note: 'House rules for using the HIVE space. Built in prompt 7.',
  },
  {
    id: 'supplies',
    title: 'Supplies',
    note: 'What is stocked, what to request, and who to ask. Built in prompt 7.',
  },
  {
    id: 'feedback',
    title: 'Feedback',
    note: 'Tell the HIVE team what is working and what is not. Built in prompt 7.',
  },
]

export default function Space() {
  return (
    <div className="container-hive section-rhythm">
      <SectionEyebrow>The space</SectionEyebrow>
      <h1 className="mt-3 font-display text-display-lg font-semibold opsz-display">Space</h1>
      <p className="mt-4 max-w-xl text-body-lg text-ink">
        Placeholder shell. Guidelines, supplies and feedback all live on this page.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="mt-16 scroll-mt-28 border-t border-border pt-8">
          <h2 className="font-display text-display-md font-semibold">{section.title}</h2>
          <p className="mt-3 max-w-xl text-body text-ink">{section.note}</p>
        </section>
      ))}
    </div>
  )
}
