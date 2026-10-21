<script setup lang="ts">
type SectionId = 'overview' | 'problem' | 'approach' | 'alerts' | 'guidance' | 'status' | 'solution' | 'learning' | 'next-steps' | 'extra'
const sections: Array<{ id: SectionId, label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'approach', label: 'Approach' },
  { id: 'alerts', label: 'Proactive alerts' },
  { id: 'guidance', label: 'Hardware guidance' },
  { id: 'status', label: 'Status & actions' },
  { id: 'solution', label: 'End-to-end' },
  { id: 'learning', label: 'Learnings' },
  { id: 'next-steps', label: 'Next steps' },
  { id: 'extra', label: 'Extra' },
]

const route = useRoute()
const activeSection = ref<SectionId>('overview')
const pageRef = ref<HTMLElement | null>(null)
const projectScrollRef = ref<HTMLElement | null>(null)
const hasMoreProjects = ref(false)
const isProjectScrolling = ref(false)
let projectScrollTimer: ReturnType<typeof setTimeout> | undefined
let projectResizeObserver: ResizeObserver | undefined
let prototypeResizeObserver: ResizeObserver | undefined
function updateProjectScroll() {
  const el = projectScrollRef.value
  hasMoreProjects.value = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
function onProjectScroll() {
  updateProjectScroll()
  isProjectScrolling.value = true
  clearTimeout(projectScrollTimer)
  projectScrollTimer = setTimeout(() => { isProjectScrolling.value = false }, 800)
}
let scrollFrame: number | undefined
let sectionObserver: IntersectionObserver | undefined

watch(() => route.hash, (hash) => {
  const hashSection = hash.slice(1) as SectionId
  if (sections.some(section => section.id === hashSection)) {
    activeSection.value = hashSection
  }
}, { immediate: true })

useHead({ title: 'DoorDash Point of Sale — Aaron Lee' })

function updateActiveSection() {
  scrollFrame = undefined
  const sectionElements = pageRef.value?.querySelectorAll<HTMLElement>('[data-case-section]')
  if (!sectionElements?.length) return

  const activationLine = window.innerHeight * 0.6
  let current = sectionElements[0]?.dataset.caseSection as SectionId

  sectionElements.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      current = section.dataset.caseSection as SectionId
    }
  })

  const scrollTop = Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  )
  const viewportBottom = scrollTop + document.documentElement.clientHeight
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )

  if (Math.ceil(viewportBottom) >= pageHeight) {
    current = sectionElements[sectionElements.length - 1]?.dataset.caseSection as SectionId
  }

  if (current) activeSection.value = current
}

function scheduleSectionUpdate() {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(updateActiveSection)
}

onMounted(() => {
  const firstPrototypeStage = pageRef.value?.querySelector<HTMLElement>('.first-prototype .prototype__stage')
  if (firstPrototypeStage) {
    prototypeResizeObserver = new ResizeObserver(() => {
      pageRef.value?.style.setProperty('--doordash-outcomes-height', `${firstPrototypeStage.getBoundingClientRect().height}px`)
    })
    prototypeResizeObserver.observe(firstPrototypeStage)
  }
  if (projectScrollRef.value) {
    projectResizeObserver = new ResizeObserver(updateProjectScroll)
    projectResizeObserver.observe(projectScrollRef.value)
    updateProjectScroll()
  }
  const initialHash = window.location.hash.slice(1) as SectionId
  if (sections.some(section => section.id === initialHash)) {
    activeSection.value = initialHash
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }

  nextTick(() => {
    const sectionElements = pageRef.value?.querySelectorAll<HTMLElement>('[data-case-section]')

    if (sectionElements?.length) {
      sectionObserver = new IntersectionObserver(scheduleSectionUpdate)
      sectionElements.forEach(section => sectionObserver?.observe(section))
    }

    updateActiveSection()
  })

  window.addEventListener('scroll', scheduleSectionUpdate, { passive: true })
  document.addEventListener('scroll', scheduleSectionUpdate, { passive: true, capture: true })
  window.addEventListener('resize', scheduleSectionUpdate)
})

onBeforeUnmount(() => {
  projectResizeObserver?.disconnect()
  prototypeResizeObserver?.disconnect()
  clearTimeout(projectScrollTimer)
  window.removeEventListener('scroll', scheduleSectionUpdate)
  document.removeEventListener('scroll', scheduleSectionUpdate, true)
  window.removeEventListener('resize', scheduleSectionUpdate)
  sectionObserver?.disconnect()
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <article ref="pageRef" class="doordash-case">
    <CaseStudySectionNav :sections="sections" :active-section="activeSection" label="DoorDash case study sections" @select="activeSection = $event" />
    <div class="case-content">
      <section id="overview" class="copy overview" data-case-section="overview">
        <h1>DoorDash Point of Sale</h1>
        <div class="text-group">
          <h2>Designing a self-serve POS hardware experience for merchants</h2>
          <p>DoorDash’s point of sale initiative needed to shift from white-glove setup and support to a scalable self-serve experience. I worked alongside the infrastructure team to design device self-troubleshooting and setup experiences to reduce support inbound for easy-fix issues and reduce onsite setup time.</p>
        </div>
        <ul class="case-meta" aria-label="Project details">
          <li>Shipped to 500+ merchants</li><li>Product design intern</li><li>Pathfinder, Infrastructure Team</li><li>May 2026 – July 2026</li>
        </ul>
      </section>

      <section class="story outcomes" aria-labelledby="outcomes-title">
        <h2 id="outcomes-title" class="copy">Key outcomes from merchant self-troubleshooting</h2>
        <div class="outcomes__panel">
          <div class="outcomes__numbers">
            <div class="outcomes__metric outcomes__metric--primary"><strong>-40.0%</strong><p>printer failure rate</p></div>
            <div class="outcomes__metric outcomes__metric--secondary"><strong>-48.9%</strong><p>Total printer errors</p></div>
          </div>
          <div class="outcomes__quotes">
            <blockquote><p>“Yeah Will [support team manager] was the one to bring it up!! He was singing ur praises saying it was positive signal to build the same flows out for all the other auxiliary devices”</p><footer>Rebecca, Staff Product Designer</footer></blockquote>
            <blockquote><p>“We will use this as a positive signal for other helpful UI elements; troubleshooting UI features may help with simple errors on the POS, KDS, etc.”</p><p>“We could also look to expand the problems the UI can handle to further alleviate Support effort.”</p><footer>Ankit + Dhawal, Product Managers</footer></blockquote>
          </div>
        </div>
      </section>

      <section class="project-scope" aria-labelledby="scope-title">
        <h2 id="scope-title" class="copy">Projects Overview</h2>
        <div class="project-scope__viewport" :class="{ 'project-scope__viewport--more': hasMoreProjects }">
        <div ref="projectScrollRef" class="project-scope__scroll" :class="{ 'project-scope__scroll--active': isProjectScrolling }" role="region" aria-labelledby="scope-title" tabindex="0" @scroll.passive="onProjectScroll">
          <div class="project-scope__track">
          <table class="project-scope__table">
            <thead><tr><th scope="col">Name</th><th scope="col">Goal</th><th scope="col">Target Metric</th><th scope="col">Outcome</th></tr></thead>
            <tbody>
              <tr>
                <th scope="row">1. Printer self-troubleshooting<br /><a class="project-tag" href="#troubleshooting-title">this case study<span class="project-tag__arrow" aria-hidden="true" /></a></th>
                <td>Help merchants discover fixes for their hardware devices and fix issues themselves, starting with kitchen and receipt printers.</td>
                <td><p>Reduced printer failure rate</p><p>Reduced total printer-related support inbound volume.</p></td>
                <td><p>Stat. significant <strong>-40.0%</strong> in printer failure rate and <strong>-48.9%</strong> total printer errors.</p><p>Non stat. significant <strong>-43.5%</strong> printer-related support inbound</p></td>
              </tr>
              <tr>
                <th scope="row">2. Printer self-setup<br /><a class="project-tag project-tag--subdued" href="#printer-setup">extra<span class="project-tag__arrow" aria-hidden="true" /></a></th>
                <td>Allow merchants to self-setup their hardware devices without white-glove support, starting with kitchen and receipt printers.</td>
                <td>Reduced time spent during on-site setup.</td>
                <td>Handed off to senior designer</td>
              </tr>
              <tr>
                <th scope="row">3. Prep station self-setup<br /><a class="project-tag project-tag--subdued" href="#prep-station-setup">extra<span class="project-tag__arrow" aria-hidden="true" /></a></th>
                <td>Allow merchants to self-setup kitchen stations for routing orders and prep items using the main POS terminal, since merchants don’t use their laptop.</td>
                <td>More than 0 merchants able to self-setup prep stations</td>
                <td><p>Presented to EU brand, Wolt.</p><p>De-prioritized</p></td>
              </tr>
              <tr>
                <th scope="row">4. Art direction<br /><a class="project-tag project-tag--subdued" href="#art-direction">extra<span class="project-tag__arrow" aria-hidden="true" /></a></th>
                <td>Capture merchants' attention and build excitement for the point-of-sale stealth exit marketing push.</td>
                <td>…</td>
                <td>…</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
        </div>
      </section>

      <section class="story" aria-labelledby="troubleshooting-title">
        <div class="copy text-group">
          <h2 id="troubleshooting-title" class="project-anchor">Printer self-troubleshooting experience</h2>
          <p>This case study focuses on printer self-troubleshooting, one of three self-serve hardware initiatives alongside printer setup and prep station setup.</p>
        </div>
        <DoorDashPrototype class="first-prototype" clip="status-bar-entry" caption="Fig. 1. Printer self-troubleshooting, from issue discovery to resolution." />
      </section>

      <section id="problem" class="story" data-case-section="problem">
        <div class="copy text-group">
          <h2>Simple hardware issues were becoming support calls</h2>
          <p>70% of inbound support came from easy-to-solve hardware issues. Merchants struggled to find fixes and follow them.</p>
          <ol class="case-numbered-list findings-list">
            <li><div><h3>Unclear entry point</h3><p>Merchants didn’t know the status bar opened troubleshooting.</p></div></li>
            <li><div><h3>Easy-to-miss instructions</h3><p>Small error messages were overlooked, according to Support.</p></div></li>
            <li><div><h3>Missing hardware guidance</h3><p>Instructions didn’t show where switches and cables were, or what was safe to unplug.</p></div></li>
          </ol>
        </div>
        <DoorDashPrototype clip="before" caption="Fig. 2. Original troubleshooting experience, with an unclear entry point and instructions that left physical hardware handling to the merchant." />
      </section>

      <section id="approach" class="copy text-group" data-case-section="approach" aria-labelledby="approach-title">
        <h2 id="approach-title">Make fixes discoverable, then make them doable</h2>
        <p>The experience needed to surface issues proactively, guide merchants through their specific hardware, and clearly communicate when an issue was resolved.</p>
      </section>

      <section id="alerts" class="story" data-case-section="alerts">
        <div class="copy text-group"><h2 class="numbered-heading"><span class="numbered-heading__number">1</span><span>Proactive alerts with a clear next step</span></h2><p>The original error message was easy to miss and offered no direct action. A prominent toast names the printer issue and provides a Troubleshoot button, giving merchants a clear next step.</p></div>
        <figure class="alert-comparison-figure">
          <div class="paired alert-comparison">
            <DoorDashPrototype screen-image="/images/case-studies/doordash/alert-before.png" screen-view-box="20 37 880 484" screen-alt="Original POS with a subtle printer error indicator" caption="Before: easy-to-miss error messaging." hide-caption />
            <span class="alert-comparison__arrow" aria-hidden="true"></span>
            <DoorDashPrototype screen-image="/images/case-studies/doordash/alert-after.png" screen-view-box="30 37 860 484" screen-alt="Updated POS with a high-contrast actionable printer alert" caption="After: a clear troubleshooting action." hide-caption />
          </div>
          <figcaption>Fig. 3. Before: easy-to-miss error messaging. After: a clear troubleshooting action.</figcaption>
        </figure>
        <DoorDashPrototype clip="toast-entry" caption="Fig. 4. Troubleshooting through a printer alert." />
        <section class="copy text-group" aria-labelledby="status-bar-logic-title">
          <h2 id="status-bar-logic-title">An actionable status bar with error severity weights built-in for faster troubleshooting</h2>
          <p>An action-oriented status bar button gives unfamiliar merchants a clear entry point while preserving the route familiar merchants already use.</p>
          <p>Forty merchants had tapped the status bar more than 100 times in a month. The change needed to build on that behavior.</p>
        </section>
        <figure class="logical-prototype">
          <div class="logical-prototype__stage">
            <VideoPlayer case-study src="/videos/doordash/status-bar.mp4" class="logical-prototype__video" />
          </div>
          <figcaption>Fig. 5. Configuring device states to demonstrate status bar logic and issue prioritization.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>Carry the status bar logic across devices</h2>
          <p>The work extended beyond the POS prototype into troubleshooting documentation, custom hardware icons, and handheld status bar explorations.</p>
          <ol class="case-numbered-list">
            <li><div><h3>Document the troubleshooting logic</h3><p>Captured device errors, logical state changes, severity weights, and action-oriented labels in a shared logic document, including considerations for kiosks and kitchen displays.</p></div></li>
            <li><div><h3>Identify hardware at a glance</h3><p>Custom device icons distinguish hardware types and their error states within the compact status bar.</p></div></li>
            <li><div><h3>Adapt to handheld screens</h3><p>Explored compact status bar treatments that preserve issue priority and a clear troubleshooting action alongside connection and battery indicators.</p></div></li>
          </ol>
        </div>
        <figure class="status-system">
          <div class="status-system__stage">
          <div class="status-system__media">
            <VideoPlayer case-study class="status-system__video" src="/videos/doordash/status-logic-doc.mp4" aria-label="Walkthrough of the Troubleshoot-forward Status Bar Logic Doc" />
            <div class="status-system__examples">
              <img src="/images/case-studies/doordash/handheld-status-bar.png" alt="Handheld status bar explorations for printer issues, POS disconnection, and offline mode" loading="lazy" />
              <img src="/images/case-studies/doordash/hardware-icons.png" alt="Custom hardware icons for device types and error states" loading="lazy" />
            </div>
          </div>
          </div>
          <figcaption>Fig. 6. Troubleshooting logic walkthrough, handheld status bar explorations, and custom hardware icons.</figcaption>
        </figure>
      </section>

      <section id="guidance" class="story" data-case-section="guidance">
        <div class="copy text-group"><h2 class="numbered-heading"><span class="numbered-heading__number">2</span><span>Guidance that matches the hardware in front of you</span></h2><p>A receipt printer, a floor kiosk, and a counter kiosk need different instructions. Printers had different network configurations such as Bluetooth/Wi-Fi, physical setups, and model types, with each having different ways of turning it on/off and accessing plugs.</p></div>
        <div class="copy text-group"><h2>Let merchants identify their specific printer configuration when the system can’t</h2></div>
        <figure class="printer-flows">
          <div class="printer-flows__stage">
            <h3 class="printer-flows__checkpoint">Ideal scenario: pass device configuration and model along with error for lowest cognitive load on merchants</h3>
            <img src="/images/case-studies/doordash/flow-ideal-detail.png" alt="Ideal flow with automatic device identification" loading="lazy" />
            <div class="printer-flows__transition">
              <span class="printer-flows__connector"><img src="/images/case-studies/doordash/flow-connector-line-vertical.svg" alt="" aria-hidden="true" /></span>
              <h3 class="printer-flows__checkpoint">Accommodate infrastructure roadmap and networking bottlenecks</h3>
              <span class="printer-flows__connector"><img src="/images/case-studies/doordash/flow-connector-arrow-vertical.svg" alt="" aria-hidden="true" /></span>
            </div>
            <img src="/images/case-studies/doordash/flow-adapted-detail.png" alt="Adapted flow with manual printer selection" loading="lazy" />
            <h3 class="printer-flows__checkpoint">Merchant can self-identify the device they are troubleshooting</h3>
          </div>
          <figcaption>Fig. 7. Ideal flow and adapted flow with manual printer identification.</figcaption>
        </figure>
        <figure class="status-actions status-actions--illustrations"><div class="status-actions__stage"><img src="/images/case-studies/doordash/printer-illustrations.png" alt="Visual guide for TSP100IV and TSP100III printers, floor kiosks, and counter kiosks, showing switches, cables, and opening mechanisms" loading="lazy" /></div><figcaption>Fig. 8. Visual guide for printer models and kiosk hardware.</figcaption></figure>
        <DoorDashPrototype clip="select-printer" caption="Fig. 9. Illustrated printer selection." />
      </section>

      <section id="status" class="story" data-case-section="status">
        <div class="copy text-group"><h2 class="numbered-heading"><span class="numbered-heading__number">3</span><span>Make status changes and next actions unmistakable</span></h2><p>The primary action could be “Check status,” “Test print,” or “Done.” I explored how to communicate hardware status changes while keeping those actions predictable.</p></div>
        <ol class="copy case-numbered-list exploration-label">
          <li data-label="A"><div><h3>Status banner</h3><p>The status and action felt connected, but the banner pulled attention away from the written guide and weakened the primary action.</p></div></li>
          <li data-label="B"><div><h3>Floating status toast</h3><p>The gradient and toast made feedback noticeable, but a temporary component and clustered actions were a poor fit for persistent device status.</p></div></li>
        </ol>
        <figure class="exploration-comparison">
          <div class="paired exploration-comparison__stage">
            <DoorDashPrototype clip="iteration-banner" playback-group="status-explorations" caption="A. Status banner exploration." hide-caption />
            <DoorDashPrototype clip="iteration-toast" playback-group="status-explorations" caption="B. Floating status toast exploration." hide-caption />
          </div>
          <figcaption>Fig. 10. Status banner (A) and floating status toast (B) explorations.</figcaption>
        </figure>
        <div class="copy text-group"><h2>One footer component, a consistent status-action pattern</h2><p>The final component keeps secondary and primary actions in a stable location. Distinct status treatments and action swaps make warnings, critical errors, and success easy to tell apart.</p></div>
        <figure class="status-actions"><div class="status-actions__stage"><img src="/images/case-studies/doordash/status-actions.png" alt="Final footer patterns for printer success, device success, warnings, and critical errors" loading="lazy" /></div><figcaption>Fig. 11. Footer states for success, warnings, and critical errors.</figcaption></figure>
      </section>

      <section id="solution" class="story" data-case-section="solution">
        <div class="copy text-group"><h2 class="numbered-heading"><span class="numbered-heading__number">4</span><span>The end-to-end experience</span></h2><p>Merchants can enter through the status bar or a proactive toast, find guidance for their hardware, and see whether the issue is resolved. Support remains available when it persists.</p></div>
        <DoorDashPrototype clip="before" caption="Fig. 12. Original printer troubleshooting experience." />
        <DoorDashPrototype clip="printer-types" caption="Fig. 13. Troubleshooting across different printer types." />
      </section>

      <section id="learning" class="copy story closing-section" data-case-section="learning">
        <h2>Learnings</h2>
        <ol class="case-numbered-list">
          <li><div><h3>Think in frameworks that scale</h3><p>Design interaction patterns, layouts, and error logic to extend beyond one device. A consistent status-action model made that system clearer.</p></div></li>
          <li><div><h3>Prototype, show, and ask sooner</h3><p>Moving between prototypes, the canvas, and conversations surfaced questions I didn’t know to ask. Showing the work helped uncover gaps earlier.</p></div></li>
          <li><div><h3>Keep scope focused</h3><p>Start with the immediate merchant problem and account for infrastructure constraints. Complexity will come; the first experience still needs to be clear.</p></div></li>
        </ol>
      </section>

      <section id="next-steps" class="copy story closing-section" data-case-section="next-steps">
        <h2>Next steps</h2>
        <ol class="case-numbered-list">
          <li><div><h3>Measure support effort saved</h3><p>Track support inbound volume, errors resolved on the troubleshooting screen, and hours Support spends on these issues through the Legacy POS feature flag.</p></div></li>
          <li><div><h3>Extend guidance to more devices</h3><p>Build on the status bar’s error states and severity weights for kiosks, kitchen displays, and handhelds.</p></div></li>
          <li><div><h3>Continue toward self-serve setup</h3><p>Develop the printer setup wizard and prep station setup explorations so merchants can configure hardware and kitchen routing from the POS.</p></div></li>
        </ol>
      </section>

      <section id="extra" class="story" data-case-section="extra">
        <div class="copy text-group">
          <h2 class="extra-heading">Extra</h2>
        </div>
        <div class="copy text-group"><h2>First build on Legacy POS</h2></div>
        <DoorDashPrototype class="extra-legacy" clip="legacy-feature-flag" caption="Fig. 14. Troubleshooting behind a feature flag on Legacy POS, intended to track support volume, issues resolved, and time saved." />
        <div class="copy text-group">
          <h2 id="printer-setup" class="project-anchor">Printer setup wizard</h2>
          <p>A first step toward self-serve, plug-and-play printer setup.</p>
        </div>
        <DoorDashPrototype clip="printer-setup" caption="Fig. 15. Adding and setting up a printer from the POS." />
        <div class="copy text-group">
          <h2 id="prep-station-setup" class="project-anchor">Prep station setup</h2>
          <p>Merchants rarely have a laptop on hand. This exploration brings kitchen routing setup directly to the POS.</p>
        </div>
        <DoorDashPrototype clip="prep-station" caption="Fig. 16. Configuring prep stations and kitchen routing on the POS." />
        <div class="copy text-group"><h2 id="art-direction" class="project-anchor">Art direction</h2></div>
        <DoorDashArtCarousel />
      </section>
    </div>
  </article>
</template>

<style scoped>
.doordash-case {
  /* Large presentation blocks follow the existing case-study measure. */
  --doordash-media-width: 1800px;
  --case-copy-media-gap: var(--space-24);
  --doordash-diagram-width: 900px;
  /* Give the footer-state diagram more room for its labels. */
  --doordash-footer-diagram-width: 1040px;
  --doordash-flow-background: #f7f7f7;
  --doordash-legacy-background: #191919;
  --doordash-footer-background: #eeeeee;
  /* Number tiles from Figma 622:2, scaled to the section heading. */
  --doordash-number-background: #f3bb2e;
  --doordash-number-text: #000;
  --doordash-number-radius: var(--radius-m);
  --doordash-number-size: var(--space-10);
  /* Standalone logical prototype presentation surface. */
  --doordash-logic-background: #008187;
  --doordash-logic-inset: var(--space-12);
  --doordash-logic-video-height: max(var(--space-24), calc(100svh - var(--layout-header-clearance) - var(--space-24) - var(--doordash-logic-inset) * 2));
  /* Softer metric hierarchy, reduced from the original Figma display sizes. */
  --doordash-stat-primary-size: 48px;
  --doordash-stat-secondary-size: var(--font-size-xxl);
  --doordash-outcomes-background: #f8bd2f;
  --doordash-outcomes-text: #000;
  --doordash-quote-bg: #fff;
  --doordash-quote-shadow: 0 var(--space-1) var(--space-3) rgb(0 0 0 / 5%);
  /* Keep the outcome quotes at a compact reading measure. */
  --doordash-quote-width: 480px;
  /* Four readable columns at the Figma overview table's intended scale. */
  --doordash-project-table-width: 1152px;
  --doordash-quote-text: #1c1f24;
  --doordash-quote-attribution: #5e3707;
  /* Match Nova/Nuance case-study page chrome. */
  padding: calc(var(--layout-header-clearance) + var(--space-m)) var(--layout-content-edge) var(--space-30);
  color: var(--color-text);
  font-size: var(--font-size-s);
  /* Body inherits medium from global styles; case studies use regular. */
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}
.case-content { display: flex; flex-direction: column; align-items: center; gap: var(--case-copy-media-gap); max-width: var(--doordash-media-width); margin-inline: auto; }
.copy { width: min(var(--content-copy-width), 100%); margin-inline: auto; }
.overview { display: flex; flex-direction: column; gap: var(--space-7); }
h1 { font-size: var(--font-size-xxl); font-weight: var(--font-weight-heading); }
h2 { font-size: var(--font-size-l); font-weight: var(--font-weight-heading); }
.extra-heading { font-size: var(--font-size-xxl); }
h3 { font-size: var(--font-size-m); font-weight: var(--font-weight-heading); }
.text-group { display: flex; flex-direction: column; gap: var(--space-m); }
.text-group p, blockquote p { margin: 0; }
.case-meta { color: var(--color-subdued); display: flex; flex-direction: column; gap: var(--space-xxs); }
.case-meta li:first-child { color: var(--color-text); }
.story { width: 100%; display: flex; flex-direction: column; gap: var(--case-study-content-gap); scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m)); }
.story.copy { width: min(var(--content-copy-width), 100%); gap: var(--space-m); }
/* A new narrative topic following media gets the same separation as Nova and Nuance. */
.story > :is(figure, .paired) + .copy { margin-top: calc(var(--case-copy-media-gap) - var(--case-study-content-gap)); }
/* Add only the extra space: the story already supplies the standard gap. */
.story > :is(figure, .paired) + :is(figure, .paired) {
  margin-top: calc(var(--case-study-media-stack-gap) - var(--case-study-content-gap));
}
.overview { scroll-margin-top: var(--layout-header-clearance); }
.outcomes__panel { width: min(var(--content-copy-width), 100%); margin-inline: auto; min-height: var(--doordash-outcomes-height, auto); display: grid; grid-template-columns: minmax(0, var(--doordash-quote-width)); justify-content: center; align-content: center; align-items: center; gap: var(--space-10); padding: var(--space-12) var(--space-xl); background: var(--doordash-outcomes-background); color: var(--doordash-outcomes-text); border-radius: var(--case-study-surface-radius); }
.outcomes__numbers { display: flex; flex-direction: column; align-items: center; gap: var(--space-8); text-align: center; font-weight: var(--font-weight-regular); line-height: var(--line-height-heading); }
.outcomes__metric { display: flex; flex-direction: column; align-items: center; }
.outcomes__metric strong { font-weight: inherit; line-height: inherit; }
.outcomes__metric p { margin: 0; font-weight: inherit; line-height: inherit; }
.outcomes__metric--primary strong { font-size: var(--doordash-stat-primary-size); }
.outcomes__metric--primary p { font-size: var(--font-size-m); }
.outcomes__metric--secondary strong { font-size: var(--doordash-stat-secondary-size); }
.outcomes__metric--secondary p { font-size: var(--font-size-s); }
.outcomes__quotes { display: flex; flex-direction: column; gap: var(--space-s); width: 100%; max-width: var(--doordash-quote-width); justify-self: center; }
blockquote { display: flex; flex-direction: column; gap: var(--space-s); padding: var(--space-m); background: var(--doordash-quote-bg); color: var(--doordash-quote-text); border-radius: var(--radius-m); box-shadow: var(--doordash-quote-shadow); }
blockquote p { font-weight: var(--font-weight-medium); }
blockquote footer { color: var(--doordash-quote-attribution); text-align: right; font-size: var(--font-size-xs); }
/* The scroll viewport reaches the screen edges; only the initial table position is inset. */
.project-scope { width: 100%; min-width: 0; display: flex; flex-direction: column; gap: var(--case-study-content-gap); }
.project-scope__viewport { position: relative; width: 100vw; margin-inline: calc((100% - 100vw) / 2); }
.project-scope__viewport::after { content: ''; position: absolute; inset-block: 0; right: 0; width: min(var(--space-40), 25vw); background: linear-gradient(to right, transparent, var(--color-bg) 80%); pointer-events: none; opacity: 0; }
.project-scope__viewport--more::after { opacity: 1; }
.project-scope__scroll { width: 100%; overflow-x: auto; overscroll-behavior-x: contain; padding-bottom: var(--space-m); }
.project-scope__scroll::-webkit-scrollbar-thumb { background: transparent; transition: background var(--transition-fast); }
.project-scope__scroll--active::-webkit-scrollbar-thumb { background: var(--color-border); }
@supports not selector(::-webkit-scrollbar) {
  .project-scope__scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
  .project-scope__scroll--active { scrollbar-color: var(--color-border) transparent; }
}
.project-scope__track { width: max-content; padding-left: max(var(--layout-content-edge), calc((100vw - var(--content-copy-width)) / 2)); padding-right: var(--space-50); }
.project-scope__scroll:focus-visible { outline: 1px solid var(--color-subdued); }
.project-scope__table { width: var(--doordash-project-table-width); table-layout: fixed; border-collapse: collapse; text-align: left; }
.project-scope__table th, .project-scope__table td { vertical-align: top; padding: 0 var(--space-10) var(--space-l) 0; }
.project-scope__table th:last-child, .project-scope__table td:last-child { padding-right: 0; }
.project-scope__table th { font-weight: var(--font-weight-medium); }
.project-scope__table tbody th { font-size: var(--font-size-m); }
.project-tag { display: inline-flex; align-items: center; gap: var(--space-xs); margin-top: var(--space-s); margin-bottom: var(--space-xs); height: var(--space-8); padding: var(--space-xxs) var(--space-s); border-radius: var(--radius-pill); background: var(--doordash-number-background); color: var(--doordash-number-text); font-family: var(--font-mono-ui); font-size: var(--font-size-xs); font-weight: var(--font-weight-regular); text-decoration: none; transform: rotate(-3deg); }
.project-tag--subdued { background: var(--color-border); color: var(--color-subdued); transform: rotate(2deg); }
.project-tag__arrow { width: var(--icon-size-xs); height: var(--icon-size-xs); background: currentColor; mask: url("/images/case-studies/doordash/arrow-thin.svg") center / contain no-repeat; }
.project-tag:focus-visible { outline: 1px solid var(--color-text); outline-offset: var(--space-1); }
.project-anchor { scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m)); }
.project-scope__table strong { font-weight: var(--font-weight-semibold); }
.paired { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--case-study-media-stack-gap) var(--space-xl); }
figure { margin: 0; min-width: 0; }
figure img { width: 100%; height: auto; border-radius: var(--case-study-surface-radius); }
figcaption { width: min(var(--content-copy-width), 100%); margin: var(--space-xs) auto 0; color: var(--color-subdued); font-family: var(--font-mono-ui); font-size: var(--font-size-s); line-height: var(--line-height-body); text-align: left; }
/* Match Nova's gallery captions to the left edge of their media. */
.paired :deep(figcaption) { width: 100%; margin-inline: 0; }
.logical-prototype { width: 100%; }
.logical-prototype__stage { display: flex; justify-content: center; padding: var(--doordash-logic-inset); background: var(--doordash-logic-background); border-radius: var(--case-study-surface-radius); }
.logical-prototype__video { width: min(100%, calc(var(--doordash-logic-video-height) * 2910 / 1802)); height: auto; aspect-ratio: 2910 / 1802; object-fit: contain; border-radius: var(--case-study-surface-radius); }
.printer-flows { width: 100%; }
.printer-flows__stage { display: flex; flex-direction: column; align-items: center; gap: var(--space-10); justify-content: center; padding: var(--space-8) var(--space-xl); background: var(--doordash-outcomes-background); border-radius: var(--case-study-surface-radius); }
.printer-flows__stage > img { width: min(var(--doordash-diagram-width), 100%); height: auto; box-shadow: var(--doordash-quote-shadow); }
.printer-flows__checkpoint { width: min(var(--content-copy-width), 100%); margin: 0; font-size: var(--font-size-m); line-height: var(--line-height-heading); color: var(--doordash-number-text); text-align: center; }
.printer-flows__transition { display: flex; flex-direction: column; align-items: center; gap: var(--space-m); }
.printer-flows__connector { display: flex; align-items: center; justify-content: center; height: calc(var(--space-10) * 2); }
.printer-flows__connector img { width: auto; height: auto; max-width: none; border-radius: 0; }
.status-system { width: 100%; }
.status-system__stage { display: flex; justify-content: center; padding: var(--space-xl); background: var(--doordash-logic-background); border-radius: var(--case-study-surface-radius); }
.status-system__media { width: min(var(--doordash-diagram-width), 100%); box-shadow: var(--doordash-quote-shadow); display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: var(--space-m); padding: var(--space-xl); align-items: start; background: var(--doordash-flow-background); border-radius: var(--case-study-surface-radius); }
.status-system__video { display: block; width: 100%; height: auto; aspect-ratio: 2540 / 1716; border-radius: var(--case-study-surface-radius); }
.status-system__examples { display: flex; flex-direction: column; gap: var(--space-m); }
@media (max-width: 639px) { .status-system__media { grid-template-columns: 1fr; } }
.status-actions { width: 100%; }
.status-actions__stage { display: flex; justify-content: center; padding: var(--space-xl); background: var(--doordash-footer-background); border-radius: var(--case-study-surface-radius); }
.status-actions--illustrations .status-actions__stage { background: var(--doordash-outcomes-background); }
.status-actions__stage img { width: min(var(--doordash-footer-diagram-width), 100%); height: auto; box-shadow: var(--doordash-quote-shadow); }
.case-numbered-list { display: flex; flex-direction: column; gap: var(--space-m); counter-reset: finding; }
.case-numbered-list li { display: grid; grid-template-columns: var(--space-m) 1fr; align-items: baseline; gap: var(--space-s); counter-increment: finding; }
.case-numbered-list li::before { content: counter(finding); font-weight: var(--font-weight-medium); }
.case-numbered-list li > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: baseline; gap: var(--space-10); }
@media (max-width: 639px) {
  .case-numbered-list { gap: var(--space-xl); }
  .case-numbered-list li > div { grid-template-columns: 1fr; gap: var(--space-xs); }
}
.alert-comparison { --comparison-direction: 90deg; position: relative; align-items: end; padding: var(--space-xl) var(--space-xl) 0; border-radius: var(--case-study-surface-radius); overflow: hidden; background-image: var(--pointer-glow-texture), linear-gradient(var(--comparison-direction), var(--doordash-legacy-background) 20%, var(--doordash-flow-background) 80%); background-size: var(--space-16) var(--space-16), 100% 100%; background-blend-mode: multiply; }
.alert-comparison :deep(.prototype__stage) { padding: var(--space-s) var(--space-s) 0; background: transparent; }
.alert-comparison__arrow { position: absolute; left: 50%; top: 50%; width: var(--space-6); height: var(--space-6); transform: translate(-50%, -50%); pointer-events: none; z-index: 1; background: var(--color-text); mask: url("/images/case-studies/doordash/arrow-thin.svg") center / contain no-repeat; }
@media (max-width: 1023px) {
  .paired.alert-comparison { --comparison-direction: 180deg; grid-template-columns: 1fr; }
  .alert-comparison__arrow { transform: translate(-50%, -50%) rotate(90deg); }
}
.extra-legacy :deep(.prototype__stage) { background: var(--doordash-legacy-background); }
.closing-section p { margin: 0; }
.exploration-label li::before { content: attr(data-label); }
.exploration-comparison__stage { align-items: end; padding: var(--space-xl) var(--space-xl) 0; background: var(--doordash-flow-background); border-radius: var(--case-study-surface-radius); overflow: hidden; }
.exploration-comparison__stage :deep(.prototype__stage) { padding: var(--space-s) var(--space-s) 0; }
.numbered-heading { position: relative; }
.numbered-heading__number { position: absolute; right: calc(100% + var(--space-m)); top: 0; margin-top: calc(-1 * var(--space-xs)); display: flex; align-items: center; justify-content: center; width: var(--doordash-number-size); height: var(--doordash-number-size); border-radius: var(--doordash-number-radius); background: var(--doordash-number-background); color: var(--doordash-number-text); font-family: var(--font-mono-ui); font-size: inherit; font-weight: var(--font-weight-regular); line-height: 1.2; transform: rotate(-6deg); }
#guidance .numbered-heading__number { transform: rotate(5deg); }
@media (max-width: 1023px) {
  /* Drop the desktop offset under the sticky header, same as Nova/Nuance. */
  .doordash-case { padding-top: var(--layout-header-clearance); }
  .numbered-heading { display: flex; align-items: flex-start; gap: var(--space-m); }
  .numbered-heading__number { position: static; flex-shrink: 0; }
  .outcomes__panel { grid-template-columns: 1fr; padding: var(--space-10) var(--space-m); gap: var(--space-10); }
  .paired { grid-template-columns: 1fr; }
}
@media (max-width: 639px) {
  .doordash-case { --doordash-logic-inset: var(--space-m); }
}
</style>

