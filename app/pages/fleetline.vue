<script setup lang="ts">
type SectionId = 'overview' | 'context' | 'problem' | 'hotspots' | 'data' | 'rpm' | 'insights' | 'solution' | 'learning' | 'next-steps' | 'extra'
const sections: Array<{ id: SectionId, label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'context', label: 'Context' },
  { id: 'problem', label: 'Problem' },
  { id: 'hotspots', label: 'Hotspots' },
  { id: 'data', label: 'Contextual data' },
  { id: 'rpm', label: 'RPM diagnosis' },
  { id: 'insights', label: 'Network insights' },
  { id: 'solution', label: 'End-to-end' },
  { id: 'learning', label: 'Learnings' },
  { id: 'next-steps', label: 'Next steps' },
  { id: 'extra', label: 'Extra' },
]

const route = useRoute()
const activeSection = ref<SectionId>('overview')
const pageRef = ref<HTMLElement | null>(null)
let scrollFrame: number | undefined
let sectionObserver: IntersectionObserver | undefined
// The short closing sections can both clear the activation line after a jump,
// so a nav selection stays active until the reader scrolls on their own.
let pinnedSection: SectionId | undefined

function selectSection(id: SectionId) {
  pinnedSection = id
  activeSection.value = id
}

function releasePinnedSection() {
  pinnedSection = undefined
}

watch(() => route.hash, (hash) => {
  const hashSection = hash.slice(1) as SectionId
  if (sections.some(section => section.id === hashSection)) {
    activeSection.value = hashSection
  }
}, { immediate: true })

useHead({ title: 'Fleetline Network Map — Aaron Lee' })

function updateActiveSection() {
  scrollFrame = undefined
  if (pinnedSection) return
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
  for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(type, releasePinnedSection, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleSectionUpdate)
  document.removeEventListener('scroll', scheduleSectionUpdate, true)
  window.removeEventListener('resize', scheduleSectionUpdate)
  for (const type of ['wheel', 'touchstart', 'keydown'] as const) {
    window.removeEventListener(type, releasePinnedSection)
  }
  sectionObserver?.disconnect()
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <article ref="pageRef" class="fleetline-case">
    <CaseStudySectionNav :sections="sections" :active-section="activeSection" label="Fleetline case study sections" @select="selectSection" />
    <div class="case-content">
      <section id="overview" class="story overview" data-case-section="overview">
        <div class="copy overview__intro">
          <h1>Fleetline</h1>
          <div class="text-group">
            <h2>Helping managers understand their network and take action to best position their fleets</h2>
            <p>Fleetline is an AI planning and dispatch platform for trucking fleets. I redesigned its network map so managers can see where their fleet is busy, where it’s losing money, and what to change.</p>
          </div>
          <ul class="case-meta" aria-label="Project details">
            <li>Rolled out to 15 fleets</li><li>Product designer, contract</li><li>Mentored by Eric Wang</li><li>2026</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/network-map-after.png" alt="Redesigned Fleetline network map with load-volume markers across the United States and a market detail panel" />
          <figcaption>Fig. 1. The redesigned network map.</figcaption>
        </figure>
      </section>

      <section class="story outcomes" aria-labelledby="outcomes-title">
        <h2 id="outcomes-title" class="copy">Outcomes</h2>
        <div class="outcomes__panel">
          <div class="outcomes__metric outcomes__metric--primary"><strong>15 fleets</strong><p>rolled out</p></div>
          <div class="outcomes__metric outcomes__metric--secondary"><strong>0 → weekly</strong><p>Reported network map usage for 3 customers, from 100% dropoff to consistent weekly use</p></div>
          <p class="outcomes__note">There wasn’t enough time to gather longitudinal data due to the pivot and acquisition.</p>
        </div>
      </section>

      <section id="context" class="story" data-case-section="context">
        <div class="copy text-group">
          <h2>Fleet planning</h2>
          <p>Trucking companies (“fleets”) haul freight for businesses. Planners decide which driver takes which job. Their job is to keep trucks loaded and plan loads that pay well for the miles they take.</p>
        </div>
        <figure>
          <div class="stage">
            <div class="plan-diagram" role="img" aria-label="A load from St. Louis, MO at 08:00 to Chicago, IL at 16:00 paying $2,500 at $2.11 per mile, followed by 485 deadhead miles to the next pickup in Kansas, IL paying $1,000 at $2.20 per mile">
              <span class="plan-tag plan-tag--load plan-diagram__load">Load</span>
              <div class="plan-stop plan-diagram__pickup"><span>July 8th, 08:00 ET</span><strong>St. Louis, MO</strong></div>
              <div class="plan-stop plan-diagram__dropoff"><span>July 8th, 16:00 ET</span><strong>Chicago, IL</strong></div>
              <div class="plan-money plan-diagram__money"><span class="plan-money__rpm">$2.11 / mi</span><strong>$2,500</strong></div>
              <div class="plan-diagram__tags"><span class="plan-tag plan-tag--rpm">RPM</span><span class="plan-tag plan-tag--revenue">Revenue</span></div>
              <span class="plan-tag plan-tag--deadhead plan-diagram__deadhead">Deadhead</span>
              <div class="plan-diagram__miles"><span class="plan-miles">485 mi</span></div>
              <div class="plan-stop plan-stop--next plan-diagram__next"><span>July 8th, 22:00 ET</span><strong>Kansas, IL</strong></div>
              <div class="plan-money plan-money--next plan-diagram__next-money"><span>$2.20 / mi</span><strong>$1,000</strong></div>
            </div>
          </div>
          <figcaption>Fig. 2. A load, the empty deadhead miles to the next pickup, rate per mile (RPM), and revenue.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>Planning is extremely complex and high-stress</h2>
          <ol class="factor-list">
            <li>Network shifts</li><li>Dynamic prices</li><li>Driver availability</li><li>Equipment breaks</li>
          </ol>
          <div class="stat-callout"><strong>100,000,000+</strong><span>different ways to plan a single week</span></div>
          <p>Nobody can compare them all, so planners lean on habit, spreadsheets and phone calls. Fleets run on archaic software from 2000–2010, and regular software algorithms aren’t flexible to tribal knowledge. The cost is lost revenue, wasted time, and a higher driver churn rate.</p>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/legacy-software.png" alt="Legacy planning software with dense menus, tables, and a small map" loading="lazy" />
          <figcaption>Fig. 3. Legacy planning software.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>What is Fleetline</h2>
          <p>Fleetline is an AI planning and dispatch platform. It uses software fleets already use for truck data, then recommends driver assignments with algorithms and natural-language rules.</p>
          <ul class="case-meta fact-list" aria-label="Company details">
            <li>5M contracted ARR</li><li>15 fleets</li><li>Acquired by Optym in Aug 2026</li><li>Backed by Y Combinator, Robinhood, Bloomberg, Shopify, and others</li>
          </ul>
        </div>
        <figure>
          <div class="paired">
            <CaseStudyImage src="/images/case-studies/fleetline/product-planning.png" alt="Fleetline planning table of drivers, loads, and recommended assignments" loading="lazy" />
            <CaseStudyImage src="/images/case-studies/fleetline/product-gantt.png" alt="Fleetline dispatch timeline of driver assignments" loading="lazy" />
          </div>
          <figcaption>Fig. 4. Fleetline’s planning and dispatch views.</figcaption>
        </figure>
      </section>

      <section id="problem" class="story" data-case-section="problem">
        <div class="copy text-group">
          <h2>Understanding a fleet’s network</h2>
          <p>Planners ask “Which driver for which load?” Managers ask a bigger question: “Is our network performing well?”</p>
          <ol class="case-numbered-list">
            <li><div><h3>Where do we grow?</h3><p>See busy markets to add drivers, protect customers, and add more contract work.</p></div></li>
            <li><div><h3>Where are we losing money?</h3><p>See underpaid routes and empty miles.</p></div></li>
            <li><div><h3>Is the data worth acting on?</h3><p>Quickly gain fleet context behind metrics.</p></div></li>
            <li><div><h3>What should change?</h3><p>Act on a rule, a price, or a customer.</p></div></li>
          </ol>
          <p>Managers need a way to understand where the market lies to best take advantage of it.</p>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/old-map.png" alt="Original network map with hundreds of overlapping lane lines across the United States" loading="lazy" />
          <figcaption>Fig. 5. The original network map.</figcaption>
        </figure>
        <div class="copy text-group"><h2>Review, investigate, decide</h2></div>
        <figure>
          <ol class="stage user-flow">
            <li><h3>Review</h3><p>Scan the map for patterns.</p></li>
            <li><h3>Investigate</h3><p>Open a market or a lane. Check money, loads, and direction.</p></li>
            <li>
              <h3>Decide</h3>
              <ul>
                <li>Change a planning rule (prefer, allow, or block a market)</li>
                <li>Renegotiate rates or freight mix</li>
                <li>Fix an operations issue</li>
                <li>Fix bad data</li>
                <li>Or change nothing and keep watching</li>
              </ul>
            </li>
          </ol>
          <figcaption>Fig. 6. The manager’s user flow.</figcaption>
        </figure>
      </section>

      <section id="hotspots" class="story" data-case-section="hotspots">
        <div class="copy text-group">
          <h2 class="numbered-heading"><span class="numbered-heading__number">1</span><span>Defining a “hotspot”</span></h2>
          <p>Customers valued “hotspots”, the busiest places in a fleet’s network, for comparing their activity between key markets. Yet each spot was ambiguous: what did it count?</p>
        </div>
        <div class="copy evidence-group">
          <figure class="evidence-card"><blockquote>“Customers visit the page and then leave immediately.”</blockquote><figcaption>CTO</figcaption></figure>
          <figure class="evidence-card"><blockquote>“[Customer name] said they really needed this heatmap to see where their markets are...”</blockquote><figcaption>Forward Deployed Engineer</figcaption></figure>
        </div>
        <div class="copy text-group">
          <h2>How do we best depict hotspots so managers can quickly make comparisons?</h2>
          <ol class="case-numbered-list case-numbered-list--plain">
            <li><p>Each blob counted every pickup and delivery stop, but nothing said so.</p></li>
            <li><p>Comparison between markets was impossible.</p></li>
            <li><p>Neighboring markets overlapped.</p></li>
            <li><p>800 lanes on top crushed readability.</p></li>
          </ol>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/old-map-issues.png" alt="Original map with overlapping stop blobs and dense lane lines" loading="lazy" />
          <figcaption>Fig. 7. Unlabeled stop counts and overlapping lanes on the original map.</figcaption>
        </figure>
        <figure class="figure--medium">
          <CaseStudyImage src="/images/case-studies/fleetline/route-map-reference.png" alt="Route map reference with arcs radiating from a single hub" loading="lazy" />
          <figcaption>Fig. 8. Shoutout: a route map reference.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 1</span>Click point A → point B</h3>
          <ul class="tradeoffs">
            <li data-kind="pro">Visual clarity: moved from lane selection to market selection</li>
            <li data-kind="pro">Easier selection</li>
            <li data-kind="con">Ambiguous what data is used for comparing and measuring market activity</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/select-markets.png" alt="Map of market points where a manager selects one market, then another" loading="lazy" />
          <figcaption>Fig. 9. Iteration 1: selecting markets instead of lanes.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 2</span>Stops in context</h3>
          <p>Show the stops data, but how do managers have enough context for the number to make sense?</p>
        </div>
        <figure>
          <div class="stage stops-stage">
            <CaseStudyImage class="stops-stage__tooltip" src="/images/case-studies/fleetline/stops-tooltip.png" alt="Map tooltip for St. Louis, MO summarizing pickup and delivery stops" loading="lazy" />
            <div class="paired">
              <CaseStudyImage src="/images/case-studies/fleetline/stops-panel-a.png" alt="Detail panel explaining stop counts for St. Louis, MO" loading="lazy" />
              <CaseStudyImage src="/images/case-studies/fleetline/stops-panel-b.png" alt="Alternate detail panel explaining stop counts for St. Louis, MO" loading="lazy" />
            </div>
          </div>
          <figcaption>Fig. 10. Iteration 2: stop counts with context in a tooltip and detail panel.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 3</span>Loads vs. stops</h3>
          <p>Are stops the right metric for decision making? Do we change a lane rule? Prices? A customer? Revenue is the core driver, yet stops don’t correspond to revenue. Loads do.</p>
        </div>
        <figure>
          <div class="stage">
            <div class="paired metric-compare">
              <div class="metric-card">
                <h3>Pickup / drop-off</h3>
                <ul><li>Where crews visit customers</li><li>How concentrated pickups and deliveries are</li></ul>
                <div class="metric-card__sample">
                  <p><strong>3 stops</strong><span>$2,500</span><span>$2.11/mi</span></p>
                  <p class="metric-card__split" aria-label="Revenue per stop: $500, $1,500, unknown"><span>$500</span><span>$1,500</span><span>?</span></p>
                </div>
              </div>
              <div class="metric-card">
                <h3>Loads</h3>
                <ul><li>Where freight starts and ends</li><li>Revenue and miles sit directly next to it in the mental model</li></ul>
                <div class="metric-card__sample">
                  <p><strong>1 load</strong><span>$2,500</span><span>$2.11/mi</span></p>
                </div>
              </div>
            </div>
          </div>
          <figcaption>Fig. 11. Revenue and miles map cleanly onto a load, but not onto its stops.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>Load volume on the map, context in the panel</h2>
          <ol class="case-numbered-list">
            <li><div><h3>Comparison data on the map</h3><p>Surface load volume for at-a-glance diagnosis. Omit the location name, as it’s not cause for digging.</p></div></li>
            <li><div><h3>Contextual data in the detail panel</h3><p>Load volume becomes the primary metric. Open details for contextual data.</p></div></li>
          </ol>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/load-volume-map.png" alt="Map markers sized by load volume with a market detail panel" loading="lazy" />
          <figcaption>Fig. 12. Load volume as the map’s comparison metric.</figcaption>
        </figure>
        <figure class="figure--medium">
          <CaseStudyImage src="/images/case-studies/fleetline/load-volume-detail.png" alt="Close-up of a selected market with load volume in the detail panel" loading="lazy" />
          <figcaption>Fig. 13. Opening a market for contextual data.</figcaption>
        </figure>
      </section>

      <section id="data" class="story" data-case-section="data">
        <div class="copy text-group">
          <h2 class="numbered-heading"><span class="numbered-heading__number">2</span><span>Surfacing contextual data for decision making</span></h2>
          <p>What data is unclear and stopping an informed decision?</p>
          <ol class="case-numbered-list case-numbered-list--plain">
            <li><p>Which markets does this one connect to?</p></li>
            <li><p>Deadhead metrics, which are crucial, were missing.</p></li>
            <li><p>RPM, a key metric in planning, was missing.</p></li>
            <li><p>Load volume had no assigned direction (A → B, B → A).</p></li>
          </ol>
        </div>
        <figure>
          <div class="paired">
            <CaseStudyImage src="/images/case-studies/fleetline/market-selected.png" alt="Selected market with connected lanes and a list of loads" loading="lazy" />
            <CaseStudyImage src="/images/case-studies/fleetline/lane-selected.png" alt="Selected lane between two markets with a list of loads" loading="lazy" />
          </div>
          <figcaption>Fig. 14. Selected market and lane views without direction, deadhead, or RPM.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>Why all these metrics?</h2>
          <p>Each metric points to a different decision.</p>
        </div>
        <figure>
          <ul class="stage metric-actions">
            <li><p class="metric-actions__data"><span>Lane</span>400 loads out<br />150 loads back</p><span class="metric-actions__arrow" aria-hidden="true">→</span><p>Find return freight, or price the repositioning in.</p></li>
            <li><p class="metric-actions__data"><span>Market</span>Outbound RPM $1.80<br />Inbound RPM $2.40</p><span class="metric-actions__arrow" aria-hidden="true">→</span><p>Renegotiate rate or freight mix with the customer.</p></li>
          </ul>
          <figcaption>Fig. 15. Directional loads and RPM lead to different actions.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 1</span>Directional detail panel</h3>
          <ul class="tradeoffs">
            <li data-kind="pro">Directional data all surfaced</li>
            <li data-kind="pro">Load inbound and outbound balance promotes further investigation</li>
            <li data-kind="pro">RPM split outbound and inbound so managers could find the right market → loads → customer to investigate</li>
            <li data-kind="con">Revenue repeats load counts</li>
          </ul>
        </div>
        <figure class="figure--medium">
          <CaseStudyImage src="/images/case-studies/fleetline/detail-panel-directional.png" alt="Lane detail panel for Toledo, OH and Chicago, IL with inbound and outbound loads, revenue, and RPM" loading="lazy" />
          <figcaption>Fig. 16. Iteration 1: inbound and outbound data in the detail panel.</figcaption>
        </figure>
        <figure>
          <div class="stage">
            <CaseStudyImage src="/images/case-studies/fleetline/detail-panel-iterations.png" alt="Side-by-side explorations of detail panel layouts" loading="lazy" />
          </div>
          <figcaption>Fig. 17. Detail panel explorations.</figcaption>
        </figure>
        <div class="copy text-group"><h2>One panel for a market, another for a lane</h2></div>
        <figure>
          <div class="stage panel-compare">
            <div class="panel-compare__item">
              <CaseStudyImage src="/images/case-studies/fleetline/market-panel.png" alt="Market detail panel with outbound and inbound RPM, deadhead miles, and loads" loading="lazy" />
              <div class="panel-compare__notes">
                <h3>Market (1 selected)</h3>
                <ul><li>$: outbound and inbound RPM</li><li>Mi: deadhead</li><li>Rich data pulls the user to investigate further or dismiss quickly</li></ul>
              </div>
            </div>
            <div class="panel-compare__item">
              <CaseStudyImage src="/images/case-studies/fleetline/lane-panel.png" alt="Lane detail panel for Chicago, IL and Milwaukee, WI with directional load counts and loads named by direction" loading="lazy" />
              <div class="panel-compare__notes">
                <h3>Lane (2 selected)</h3>
                <ul><li>Bidirectional load data from lanes between selected markets</li><li>Filter by direction</li><li>Loads are named by direction instead of ID#</li></ul>
              </div>
            </div>
          </div>
          <figcaption>Fig. 18. Market and lane detail panels.</figcaption>
        </figure>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/detail-panel-final.png" alt="Final network map with a market selected and its detail panel open" loading="lazy" />
          <figcaption>Fig. 19. Iteration 6: the final detail panel.</figcaption>
        </figure>
      </section>

      <section id="rpm" class="story" data-case-section="rpm">
        <div class="copy text-group">
          <h2 class="numbered-heading"><span class="numbered-heading__number">3</span><span>Diagnosing revenue per mile at a glance</span></h2>
          <p>How do we allow users to quickly diagnose where RPM could be maximized?</p>
          <ol class="case-numbered-list case-numbered-list--plain">
            <li><p>Line thickness is not readable.</p></li>
            <li><p>Inbound and outbound RPM were difficult to compare between locations.</p></li>
            <li><p>There was no way to holistically understand RPM spread across a market.</p></li>
          </ol>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/rpm-before.png" alt="Map with lanes drawn at varying thickness from a selected market" loading="lazy" />
          <figcaption>Fig. 20. Lane thickness as the only RPM signal.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 1</span>Two curved lines for inbound and outbound</h3>
          <ul class="tradeoffs">
            <li data-kind="pro">Heading in the right direction of pulling visibility to the surface</li>
            <li data-kind="con">Unscalable when data dense</li>
            <li data-kind="con">Not readable</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/rpm-iteration-1.png" alt="Map with paired curved inbound and outbound lines between markets" loading="lazy" />
          <figcaption>Fig. 21. Iteration 1: curved inbound and outbound lines.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 2</span>Simplified lines, greater visibility by default</h3>
          <ul class="tradeoffs">
            <li data-kind="pro">Less busy with suppressed RPMs</li>
            <li data-kind="con">Difficult to scan with two data points at each market</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/rpm-iteration-2.png" alt="Map with simplified lines and two RPM values at each market" loading="lazy" />
          <figcaption>Fig. 22. Iteration 2: simplified lines.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 3</span>Color by view, scale by load count</h3>
          <p>Color is controlled by the view and scale by load count, giving a baseline of comparison between views. Markets under 12 loads are gray.</p>
        </div>
        <figure>
          <div class="stage view-trio">
            <div><CaseStudyImage src="/images/case-studies/fleetline/rpm-view-deadhead.png" alt="Deadhead view with markers colored by empty miles" loading="lazy" /><p>Deadhead</p></div>
            <div><CaseStudyImage src="/images/case-studies/fleetline/rpm-view-unique-loads.png" alt="Unique loads view with markers sized by load count" loading="lazy" /><p>Unique loads</p></div>
            <div><CaseStudyImage src="/images/case-studies/fleetline/rpm-view-rpm.png" alt="RPM view with markers labeled by rate per mile" loading="lazy" /><p>RPM</p></div>
          </div>
          <figcaption>Fig. 23. Deadhead, unique loads, and RPM views share one visual scale.</figcaption>
        </figure>
        <div class="copy text-group">
          <p>Show RPM on the busiest lanes, with a single combined value by default.</p>
          <ul class="tradeoffs">
            <li data-kind="pro">Clear contrast for inbound and outbound RPM per lane</li>
            <li data-kind="pro">Easy to scan one value per market</li>
            <li data-kind="con">Two curves make connected markets unclear</li>
            <li data-kind="con">Trade-off of imbalanced data from a single combined RPM metric</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/rpm-iteration-3.png" alt="Map showing combined RPM values at markets and RPM on the busiest lanes" loading="lazy" />
          <figcaption>Fig. 24. Iteration 3: RPM on the busiest lanes.</figcaption>
        </figure>
        <div class="copy text-group">
          <h3 class="iteration-heading"><span class="iteration-label">it. 4</span>Final map pattern</h3>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/rpm-final.png" alt="Final RPM view of the network map with colored markers and a market detail panel" loading="lazy" />
          <figcaption>Fig. 25. Iteration 4: the final RPM view.</figcaption>
        </figure>
      </section>

      <section id="insights" class="story" data-case-section="insights">
        <div class="copy text-group">
          <h2 class="numbered-heading"><span class="numbered-heading__number">4</span><span>Extended cut: network insights</span></h2>
          <p>A holistic view of the network.</p>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/network-insights-old.png" alt="Original network insights page with a map of market points and tables" loading="lazy" />
          <figcaption>Fig. 26. Network insights, before.</figcaption>
        </figure>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/network-insights-new.png" alt="Redesigned network insights page with load-volume markers and a summary panel" loading="lazy" />
          <figcaption>Fig. 27. Network insights, after.</figcaption>
        </figure>
      </section>

      <section id="solution" class="story" data-case-section="solution">
        <div class="copy text-group">
          <h2 class="numbered-heading"><span class="numbered-heading__number">5</span><span>End-to-end network mapping</span></h2>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/old-map.png" alt="Original network map with hundreds of overlapping lane lines" loading="lazy" />
          <figcaption>Fig. 28. Before.</figcaption>
        </figure>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/network-map-after.png" alt="Redesigned network map with load-volume markers and a market detail panel" loading="lazy" />
          <figcaption>Fig. 29. After.</figcaption>
        </figure>
      </section>

      <section id="learning" class="copy story closing-section" data-case-section="learning">
        <h2>Learnings</h2>
        <ol class="case-numbered-list">
          <li><div><h3>Datapoints are the driver for decisions</h3><p>Each metric does something, so I pinpoint the exact uses for that information and surrounding data.</p></div></li>
          <li><div><h3>Agent memory is the infrastructure for faster iterative cycles</h3><p>Claude can retrace all decisions with a decision log and long-running memory docs, so I never lose my own thoughts while prototyping many iterations.</p></div></li>
        </ol>
      </section>

      <section id="next-steps" class="copy story closing-section" data-case-section="next-steps">
        <h2>Next steps</h2>
        <ol class="case-numbered-list">
          <li><div><h3>Time period network comparison</h3><p>May need to expand the period-vs-period comparison feature depending on customer feedback.</p></div></li>
          <li><div><h3>Test what managers learn</h3><p>Test whether customers can name their top three weakest markets and why.</p></div></li>
          <li><div><h3>Close the loop with AI</h3><p>Build in direct rules integration and insight pulling with AI.</p></div></li>
        </ol>
      </section>

      <section id="extra" class="story" data-case-section="extra">
        <div class="copy text-group">
          <h2 class="extra-heading">Extra</h2>
        </div>
        <div class="copy text-group">
          <h2>How I work: design in the product</h2>
          <ul class="bullet-list">
            <li>Agents for prototyping with real fleet data</li>
            <li>Creating PRs</li>
            <li>Decision-log.md, FAQs.md, and other docs for context management</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/design-in-product.png" alt="Code editor with an agent conversation beside a running prototype of the network map" loading="lazy" />
          <figcaption>Fig. 30. Prototyping in the product with real fleet data.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>How I work: design in canvas</h2>
          <ul class="bullet-list">
            <li>Figma kept the design system spec, tested in code</li>
            <li>Spamming UI iterations</li>
            <li>MCP</li>
          </ul>
        </div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/design-in-canvas.png" alt="Figma canvas with rows of detail panel iterations" loading="lazy" />
          <figcaption>Fig. 31. UI iterations in Figma.</figcaption>
        </figure>
        <div class="copy text-group">
          <h2>Design system contributions</h2>
          <p>Panels, dropdowns, map markers, list rows, dashboard cards, and more.</p>
        </div>
        <figure class="copy">
          <div class="stage">
            <CaseStudyImage src="/images/case-studies/fleetline/design-system-list-rows.png" alt="Lane list row components for Chicago to Milwaukee and Milwaukee to Arizona" loading="lazy" />
          </div>
          <figcaption>Fig. 32. List row components.</figcaption>
        </figure>
        <div class="copy text-group"><h2>Tags extended</h2></div>
        <figure>
          <div class="paired">
            <CaseStudyImage src="/images/case-studies/fleetline/tags-a.png" alt="Deadhead view with mileage tags on each market" loading="lazy" />
            <CaseStudyImage src="/images/case-studies/fleetline/tags-b.png" alt="Unique loads view with load-count tags and a market tooltip" loading="lazy" />
          </div>
          <figcaption>Fig. 33. Value tags on deadhead and unique loads views.</figcaption>
        </figure>
        <div class="copy text-group"><h2>Customer performance</h2></div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/customer-performance.png" alt="Customer performance page with a revenue chart and a table of loads" loading="lazy" />
          <figcaption>Fig. 34. Customer performance.</figcaption>
        </figure>
        <div class="copy text-group"><h2>Driver performance</h2></div>
        <figure>
          <CaseStudyImage src="/images/case-studies/fleetline/driver-performance.png" alt="Driver performance table with utilization and revenue per driver" loading="lazy" />
          <figcaption>Fig. 35. Driver performance.</figcaption>
        </figure>
      </section>
    </div>
  </article>
</template>

<style scoped>
.fleetline-case {
  --fleetline-media-width: 1800px;
  --case-copy-media-gap: var(--space-24);
  /* Screenshots that read as detail rather than full product views. */
  --fleetline-medium-width: 1200px;
  /* Stone canvas and cards from the Fleetline deck. */
  --fleetline-stage-background: #fafaf9;
  --fleetline-stage-text: #1c1917;
  --fleetline-stage-subdued: #57534e;
  --fleetline-card-background: #fff;
  --fleetline-card-border: #e7e5e4;
  --fleetline-card-shadow: 0 var(--space-1) var(--space-3) rgb(0 0 0 / 5%);
  /* Deck section-divider stone with the blue rule used in the deck's chapter list. */
  --fleetline-panel-background: #44403c;
  --fleetline-accent: #2563eb;
  --fleetline-accent-text: #fff;
  --fleetline-number-size: var(--space-10);
  --fleetline-stat-primary-size: 48px;
  --fleetline-stat-secondary-size: var(--font-size-xxl);
  /* Term tags from the deck's load diagram. */
  --fleetline-tag-load-background: #e7e5e4;
  --fleetline-tag-load-text: #44403c;
  --fleetline-tag-deadhead-background: #f3e8dc;
  --fleetline-tag-deadhead-text: #904417;
  --fleetline-tag-rpm-background: #d1f0dc;
  --fleetline-tag-rpm-text: #15803d;
  --fleetline-tag-revenue-background: #dbe5fb;
  --fleetline-tag-revenue-text: #1d4ed8;
  --fleetline-deadhead-line: #f59e0b;
  /* Detail panels are narrow portrait crops; keep them near their UI scale. */
  --fleetline-panel-width: 400px;
  /* Diagram cards stay at a comfortable reading measure inside the stage. */
  --fleetline-diagram-width: 720px;
  padding: calc(var(--layout-header-clearance) + var(--space-m)) var(--layout-content-edge) var(--space-30);
  color: var(--color-text);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}
.case-content { display: flex; flex-direction: column; align-items: center; gap: var(--case-copy-media-gap); max-width: var(--fleetline-media-width); margin-inline: auto; }
.copy { width: min(var(--content-copy-width), 100%); margin-inline: auto; }
.overview__intro { display: flex; flex-direction: column; gap: var(--space-7); }
h1 { font-size: var(--font-size-xxl); font-weight: var(--font-weight-heading); }
h2 { font-size: var(--font-size-l); font-weight: var(--font-weight-heading); }
.extra-heading { font-size: var(--font-size-xxl); }
h3 { font-size: var(--font-size-m); font-weight: var(--font-weight-heading); }
p { margin: 0; }
.text-group { display: flex; flex-direction: column; gap: var(--space-m); }
.case-meta { color: var(--color-subdued); display: flex; flex-direction: column; gap: var(--space-xxs); }
.case-meta li:first-child { color: var(--color-text); }
.fact-list li:first-child { color: var(--color-subdued); }
.story { width: 100%; display: flex; flex-direction: column; gap: var(--case-study-content-gap); scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m)); }
.story.copy { width: min(var(--content-copy-width), 100%); gap: var(--space-m); }
.story > :is(figure, .paired) + .copy { margin-top: calc(var(--case-copy-media-gap) - var(--case-study-content-gap)); }
.story > :is(figure, .paired) + :is(figure, .paired) { margin-top: calc(var(--case-study-media-stack-gap) - var(--case-study-content-gap)); }
.overview { gap: var(--case-copy-media-gap); scroll-margin-top: var(--layout-header-clearance); }

figure { margin: 0; min-width: 0; width: 100%; }
figure.copy { width: min(var(--content-copy-width), 100%); }
.figure--medium { width: min(var(--fleetline-medium-width), 100%); margin-inline: auto; }
figure img { display: block; width: 100%; height: auto; border-radius: var(--case-study-surface-radius); }
figcaption { width: min(var(--content-copy-width), 100%); margin: var(--space-xs) auto 0; color: var(--color-subdued); font-family: var(--font-mono-ui); font-size: var(--font-size-s); line-height: var(--line-height-body); text-align: left; }
.paired { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--case-study-media-stack-gap) var(--space-xl); align-items: start; }
.stage { padding: var(--space-xl); background: var(--fleetline-stage-background); color: var(--fleetline-stage-text); border-radius: var(--case-study-surface-radius); }
.stage img { box-shadow: var(--fleetline-card-shadow); }

.outcomes__panel { width: min(var(--content-copy-width), 100%); margin-inline: auto; display: flex; flex-direction: column; align-items: center; gap: var(--space-8); padding: var(--space-12) var(--space-xl); background: var(--fleetline-panel-background); border-top: 1px solid var(--fleetline-accent); border-radius: var(--case-study-surface-radius); text-align: center; line-height: var(--line-height-heading); }
.outcomes__metric { display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); max-width: var(--fleetline-diagram-width); }
.outcomes__metric strong { font-weight: var(--font-weight-regular); }
.outcomes__metric--primary strong { font-size: var(--fleetline-stat-primary-size); }
.outcomes__metric--primary p { font-size: var(--font-size-m); }
.outcomes__metric--secondary strong { font-size: var(--fleetline-stat-secondary-size); }
.outcomes__note { color: var(--color-subdued); font-size: var(--font-size-xs); }

.plan-diagram {
  width: min(var(--fleetline-diagram-width), 100%);
  margin-inline: auto;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  grid-template-areas:
    "load pickup money tags"
    "load dropoff money tags"
    "deadhead miles . ."
    ". next next-money .";
  align-items: center;
  column-gap: var(--space-m);
  padding: var(--space-8) var(--space-xl);
  background: var(--fleetline-card-background);
  border: 1px solid var(--fleetline-card-border);
  border-radius: var(--case-study-surface-radius);
  font-size: var(--font-size-s);
}
.plan-diagram__load { grid-area: load; }
.plan-diagram__pickup { grid-area: pickup; }
.plan-diagram__dropoff { grid-area: dropoff; }
.plan-diagram__money { grid-area: money; }
.plan-diagram__tags { grid-area: tags; display: flex; flex-direction: column; gap: var(--space-xs); }
.plan-diagram__deadhead { grid-area: deadhead; }
.plan-diagram__miles { grid-area: miles; }
.plan-diagram__next { grid-area: next; }
.plan-diagram__next-money { grid-area: next-money; }
.plan-stop { display: flex; flex-direction: column; padding: var(--space-s) 0 var(--space-s) var(--space-m); border-left: 1px solid var(--fleetline-stage-text); }
.plan-stop span, .plan-money span { color: var(--fleetline-stage-subdued); font-size: var(--font-size-xs); }
.plan-stop strong, .plan-money strong { font-weight: var(--font-weight-medium); }
.plan-stop--next, .plan-money--next { opacity: 0.4; }
.plan-stop--next { border-left-style: dashed; }
.plan-money { display: flex; flex-direction: column; align-items: flex-end; }
.plan-money .plan-money__rpm { color: var(--fleetline-tag-rpm-text); }
.plan-money:not(.plan-money--next) strong { color: var(--fleetline-tag-revenue-text); }
.plan-diagram__miles { padding: var(--space-s) 0 var(--space-s) var(--space-m); border-left: 1px dashed var(--fleetline-deadhead-line); }
.plan-miles { display: inline-flex; padding: 0 var(--space-xs); border: 1px solid var(--fleetline-deadhead-line); border-radius: var(--radius-xs); background: var(--fleetline-tag-deadhead-background); color: var(--fleetline-tag-deadhead-text); font-family: var(--font-mono-ui); font-size: var(--font-size-xs); }
.plan-tag { justify-self: start; padding: var(--space-xxs) var(--space-s); border-radius: var(--radius-xs); font-family: var(--font-mono-ui); font-size: var(--font-size-xs); white-space: nowrap; }
.plan-tag--load { background: var(--fleetline-tag-load-background); color: var(--fleetline-tag-load-text); }
.plan-tag--deadhead { background: var(--fleetline-tag-deadhead-background); color: var(--fleetline-tag-deadhead-text); }
.plan-tag--rpm { background: var(--fleetline-tag-rpm-background); color: var(--fleetline-tag-rpm-text); }
.plan-tag--revenue { background: var(--fleetline-tag-revenue-background); color: var(--fleetline-tag-revenue-text); }

.factor-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-s) var(--space-xl); counter-reset: factor; }
.factor-list li { display: flex; gap: var(--space-s); counter-increment: factor; font-size: var(--font-size-m); font-weight: var(--font-weight-medium); }
.factor-list li::before { content: counter(factor); color: var(--color-subdued); font-family: var(--font-mono-ui); }
.stat-callout { display: flex; flex-direction: column; gap: var(--space-xxs); padding: var(--space-m); background: var(--color-surface); border-radius: var(--case-study-surface-radius); line-height: var(--line-height-heading); }
.stat-callout strong { font-size: var(--fleetline-stat-secondary-size); font-weight: var(--font-weight-regular); }
.stat-callout span { color: var(--color-subdued); }

.case-numbered-list { display: flex; flex-direction: column; gap: var(--space-m); counter-reset: finding; }
.case-numbered-list li { display: grid; grid-template-columns: var(--space-m) 1fr; align-items: baseline; gap: var(--space-s); counter-increment: finding; }
.case-numbered-list li::before { content: counter(finding); font-weight: var(--font-weight-medium); }
.case-numbered-list li > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: baseline; gap: var(--space-10); }
.case-numbered-list--plain { gap: var(--space-s); }

.user-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-m); counter-reset: flow; }
.user-flow > li { display: flex; flex-direction: column; gap: var(--space-xs); padding: var(--space-m); background: var(--fleetline-card-background); border: 1px solid var(--fleetline-card-border); border-radius: var(--case-study-surface-radius); counter-increment: flow; }
.user-flow h3::before { content: counter(flow) ". "; }
.user-flow p, .user-flow ul { color: var(--fleetline-stage-subdued); }
.user-flow ul, .bullet-list, .metric-card ul, .panel-compare__notes ul { display: flex; flex-direction: column; gap: var(--space-xxs); padding-left: var(--space-m); list-style: disc; }

.evidence-group { display: flex; flex-direction: column; gap: var(--space-s); }
.evidence-card { display: flex; flex-direction: column; gap: var(--space-xs); margin: 0; padding: var(--space-s) var(--space-m); border-radius: var(--case-study-surface-radius); background: var(--color-surface); }
.evidence-card blockquote { margin: 0; }
.evidence-card figcaption { width: 100%; margin: 0; text-align: right; font-size: var(--font-size-xs); }

.iteration-heading { display: flex; align-items: baseline; gap: var(--space-s); }
.iteration-label { flex-shrink: 0; padding: 0 var(--space-xs); border-radius: var(--radius-xs); background: var(--fleetline-accent); color: var(--fleetline-accent-text); font-family: var(--font-mono-ui); font-size: var(--font-size-xs); font-weight: var(--font-weight-regular); }
.tradeoffs { display: flex; flex-direction: column; gap: var(--space-xxs); }
.tradeoffs li { display: grid; grid-template-columns: var(--space-m) 1fr; gap: var(--space-s); }
.tradeoffs li::before { font-family: var(--font-mono-ui); color: var(--color-subdued); }
.tradeoffs li[data-kind="pro"]::before { content: "+" / "Pro:"; }
.tradeoffs li[data-kind="con"]::before { content: "−" / "Con:"; }

.stops-stage { display: flex; flex-direction: column; align-items: center; gap: var(--space-xl); }
.stops-stage__tooltip { max-width: calc(var(--fleetline-diagram-width) * 2 / 3); }

.metric-compare { width: min(var(--fleetline-diagram-width), 100%); margin-inline: auto; gap: var(--space-m); }
.metric-card { display: flex; flex-direction: column; gap: var(--space-s); height: 100%; padding: var(--space-m); background: var(--fleetline-card-background); border: 1px solid var(--fleetline-card-border); border-radius: var(--case-study-surface-radius); }
.metric-card ul { color: var(--fleetline-stage-subdued); }
.metric-card__sample { display: flex; flex-direction: column; gap: var(--space-xs); margin-top: auto; padding-top: var(--space-s); border-top: 1px solid var(--fleetline-card-border); font-family: var(--font-mono-ui); font-size: var(--font-size-xs); }
.metric-card__sample p { display: flex; flex-wrap: wrap; gap: var(--space-s); }
.metric-card__sample strong { font-weight: var(--font-weight-medium); }
.metric-card__split span { padding: 0 var(--space-xs); border-radius: var(--radius-xs); background: var(--fleetline-tag-load-background); }

.metric-actions { display: flex; flex-direction: column; align-items: center; gap: var(--space-m); }
.metric-actions li { width: min(var(--fleetline-diagram-width), 100%); display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: var(--space-m); padding: var(--space-m); background: var(--fleetline-card-background); border: 1px solid var(--fleetline-card-border); border-radius: var(--case-study-surface-radius); }
.metric-actions__data { font-family: var(--font-mono-ui); }
.metric-actions__data span { display: block; color: var(--fleetline-stage-subdued); font-size: var(--font-size-xs); }
.metric-actions__arrow { color: var(--fleetline-accent); font-size: var(--font-size-l); }

.panel-compare { display: grid; grid-template-columns: repeat(2, minmax(0, max-content)); justify-content: center; gap: var(--space-12); }
.panel-compare__item { display: flex; flex-direction: column; gap: var(--space-m); width: min(var(--fleetline-panel-width), 100%); }
.panel-compare__notes { display: flex; flex-direction: column; gap: var(--space-xs); }
.panel-compare__notes h3 { font-family: var(--font-mono-ui); font-size: var(--font-size-xs); font-weight: var(--font-weight-regular); color: var(--fleetline-stage-subdued); }

.view-trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: var(--space-xl); }
.view-trio > div { display: flex; flex-direction: column; gap: var(--space-xs); }
.view-trio p { font-family: var(--font-mono-ui); font-size: var(--font-size-xs); color: var(--fleetline-stage-subdued); }

.numbered-heading { position: relative; }
.numbered-heading__number { position: absolute; right: calc(100% + var(--space-m)); top: 0; margin-top: calc(-1 * var(--space-xs)); display: flex; align-items: center; justify-content: center; width: var(--fleetline-number-size); height: var(--fleetline-number-size); border-radius: var(--radius-m); background: var(--fleetline-accent); color: var(--fleetline-accent-text); font-family: var(--font-mono-ui); font-size: inherit; font-weight: var(--font-weight-regular); line-height: 1.2; transform: rotate(-6deg); }
#data .numbered-heading__number, #insights .numbered-heading__number { transform: rotate(5deg); }

@media (max-width: 1023px) {
  .fleetline-case { padding-top: var(--layout-header-clearance); }
  .numbered-heading { display: flex; align-items: flex-start; gap: var(--space-m); }
  .numbered-heading__number { position: static; flex-shrink: 0; }
  .outcomes__panel { padding: var(--space-10) var(--space-m); }
  .paired, .user-flow { grid-template-columns: 1fr; }
  .metric-compare { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .stage { padding: var(--space-m); }
  .case-numbered-list { gap: var(--space-xl); }
  .case-numbered-list--plain { gap: var(--space-s); }
  .case-numbered-list li > div { grid-template-columns: 1fr; gap: var(--space-xs); }
  .plan-diagram {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "load pickup money"
      "load dropoff money"
      "tags tags tags"
      "deadhead miles ."
      ". next next-money";
    padding: var(--space-m);
    column-gap: var(--space-s);
  }
  .plan-diagram__tags { flex-direction: row; padding-block: var(--space-s); }
  .metric-compare, .panel-compare, .view-trio { grid-template-columns: 1fr; }
  .panel-compare__item { margin-inline: auto; }
  .metric-actions li { grid-template-columns: 1fr; gap: var(--space-xs); }
  .metric-actions__arrow { transform: rotate(90deg); justify-self: start; }
}
</style>
