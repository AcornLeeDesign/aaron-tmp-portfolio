<script setup lang="ts">
type SectionId =
  | 'overview'
  | 'problem'
  | 'product'
  | 'constraints'
  | 'result'
  | 'learning'
  | 'next-steps'
  | 'extra'

const sections: Array<{ id: SectionId, label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'product', label: 'Product' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'result', label: 'Result' },
  { id: 'learning', label: 'Learnings' },
  { id: 'next-steps', label: 'Next steps' },
  { id: 'extra', label: 'Extra' },
]

const route = useRoute()
const activeSection = ref<SectionId>('overview')
const pageRef = ref<HTMLElement | null>(null)
let scrollFrame: number | undefined
let sectionObserver: IntersectionObserver | undefined

watch(() => route.hash, (hash) => {
  const hashSection = hash.slice(1) as SectionId
  if (sections.some(section => section.id === hashSection)) {
    activeSection.value = hashSection
  }
}, { immediate: true })

useHead({ title: 'Nova — Aaron Lee' })

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
  window.removeEventListener('scroll', scheduleSectionUpdate)
  document.removeEventListener('scroll', scheduleSectionUpdate, true)
  window.removeEventListener('resize', scheduleSectionUpdate)
  sectionObserver?.disconnect()
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <article ref="pageRef" class="nova-case">
    <div class="nova-case__layout">
      <CaseStudySectionNav
        :sections="sections"
        :active-section="activeSection"
        label="Nova case study sections"
        @select="activeSection = $event"
      />

      <div class="case-content">
        <section
          id="overview"
          class="case-section case-section--overview"
          data-case-section="overview"
        >
          <h1>Nova</h1>

          <div class="case-section__intro">
            <h2>Shipping a curiosity-forward edu platform for offline schools.</h2>
            <p>
              Led the design and research for a learning platform with a locally-run AI
              tutor to make quality education more accessible for underserved schools in
              South Sudan. Coordinated between engineers, designers, and international
              partner organizations.
            </p>
          </div>

          <ul class="case-meta" aria-label="Project details">
            <li>Shipped to 2 schools in South Sudan</li>
            <li>Founding product designer</li>
            <li>Built with Lauryn Kinsella, Devin Hayden, Teri Shim</li>
            <li>Oct 2024 – Feb 2025</li>
          </ul>

          <div class="case-section__intro case-section__approach">
            <h2>Nova: offline learning</h2>
            <p>
              A device that broadcasts an intranet, giving nearby devices access to an
              edge-computed AI tutor and resources such as Khan Academy and TED Talks.
            </p>
          </div>
        </section>

        <figure class="case-media-figure case-media-figure--overview">
          <div class="case-media-frame case-media-frame--video case-media-frame--overview-video">
            <VideoPlayer case-study
              class="case-media-video"
              src="/videos/nova_walkthrough.mp4"
            />
          </div>
          <figcaption class="case-media-caption">
            Fig 1. Nova product walkthrough across the offline learning platform.
          </figcaption>
        </figure>

        <section
          id="problem"
          class="case-section case-section--problem"
          data-case-section="problem"
        >
          <div class="case-section__heading case-copy-block">
            <h2>No-internet schools in South Sudan and Tanzania lack resources for quality education.</h2>
            <p>
              Educators at underfunded schools described unreliable internet,
              insufficient materials, and difficulty keeping up with changing curriculums.
              These problems prevented students from getting into secondary school and
              pursuing higher education.
            </p>
          </div>

          <figure class="research-figure">
            <div class="case-media-frame case-media-frame--problem">
              <img
                class="case-media-content case-media-content--cover"
                src="/images/case-studies/nova/field-research-blurred.png"
                alt="Nova field researchers speaking with an educator in a school office"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption class="case-media-caption">
              Fig 2. Field research with educators on classroom constraints and changing curriculum.
            </figcaption>
          </figure>

          <div class="problem-details">
            <div class="problem-media-story case-copy-block">
              <div class="case-section__heading">
                <h2>They had a computer lab room, yet it had no computers and the school had faulty connectivity.</h2>
              </div>

              <figure class="case-media-figure">
                <div class="case-media-frame case-media-frame--problem">
                  <img
                    class="case-media-content case-media-content--cover"
                    src="/images/case-studies/nova/computer-lab.jpg"
                    alt="An empty school computer lab with bare walls and no computers"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption class="case-media-caption">
                  Fig 3. An empty computer lab without computers or reliable connectivity.
                </figcaption>
              </figure>
            </div>

            <ol class="case-numbered-list findings-list case-copy-block">
              <li>
                <div>
                  <h3>Less than 10% of students go to college</h3>
                  <p>Exam-based culture is cutthroat.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Not enough teachers</h3>
                  <p>One teacher serves 50–60 students, and many teachers are under-qualified.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Outdated material</h3>
                  <p>The government keeps changing curriculums, and teachers have a hard time keeping up.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Unreliable internet</h3>
                  <p>Insufficient government funds and civil war make continuous access impossible.</p>
                </div>
              </li>
            </ol>

            <div class="case-evidence-group case-copy-block">
              <div class="case-section__heading">
                <h2>Students lack textbooks, equipment, and Google Search</h2>
              </div>

              <div class="case-evidence" aria-label="Educator research quotes">
                <figure class="evidence-card">
                  <blockquote>“With 50 students in a class, it’s hard to satisfy with the material we have.”</blockquote>
                  <figcaption>Teacher</figcaption>
                </figure>
                <figure class="evidence-card">
                  <blockquote>“The government gives new requirements each year, but we lack lab equipment for group work.”</blockquote>
                  <figcaption>School director</figcaption>
                </figure>
              </div>
            </div>

            <div class="case-evidence-group case-copy-block">
              <div class="case-section__heading">
                <h2>Teachers spent weeks to months making material for new government curriculum distributed each year</h2>
              </div>

              <div class="case-evidence">
                <figure class="evidence-card">
                  <blockquote>“It would be great if we could make new quizzes based on the curriculum faster.”</blockquote>
                  <figcaption>School director</figcaption>
                </figure>
              </div>
            </div>

            <div class="problem-media-story case-copy-block">
              <div class="case-section__heading">
                <h2>Little room for curiosity on global topics and hands-on experience</h2>
                <p>
                  Students borrow teachers’ phones just to Google search, despite poor
                  connectivity. Although D-Link routers were available, electrical outages
                  meant internet access was never continuous.
                </p>
                <p>
                  Existing hardware only supported disorganized hyperlinks to content that
                  wasn’t culture-relevant and was often outdated.
                </p>
              </div>

              <figure class="existing-solution-figure">
                <div class="case-media-frame existing-solution-media">
                  <img
                    class="case-media-content"
                    src="/images/case-studies/nova/figma/design-image-1-transparent.png"
                    alt="RACHEL-Plus offline learning device"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption class="case-media-caption">
                  Fig 5. RACHEL-Plus, an existing offline library with dated, difficult-to-navigate content.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          id="product"
          class="case-section case-section--product"
          data-case-section="product"
        >
          <div class="case-section__heading case-copy-block">
            <h2>Product</h2>
          </div>

          <div class="product-gallery" aria-label="Nova product demonstrations">
            <figure class="case-media-figure product-gallery__wide">
              <div class="case-media-frame case-media-frame--video case-media-frame--product-wide-video">
                <VideoPlayer case-study
                  class="case-media-video"
                  src="/videos/quiz_fullscreen_student.mp4"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 4. Curriculum-trained AI tutor to enhance student independent learning
              </figcaption>
            </figure>

            <div class="product-gallery__interlude">
              <section class="constraint-story case-copy-block">
                <div class="case-section__heading">
                  <h2>Trained a locally-run LLM on South Sudan's mandated curriculum for cultural relevance</h2>
                </div>
                <figure class="case-media-figure">
                  <div class="case-media-frame case-media-frame--hardware">
                    <img
                      class="case-media-content case-media-content--contain"
                      src="/images/case-studies/nova/nova-hardware.png"
                      alt="Guardian Inc. Nova hardware device used to run the local learning platform"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </figure>
              </section>

                  <section class="constraint-story">
                    <div class="case-section__heading case-copy-block">
                        <h2>Reduced manual work for teachers</h2>
                        <p>Teachers who’ve never interacted with AI before could easily generate quizzes with single-line prompts.</p>
                    </div>

                    <figure class="case-media-figure">
                      <div class="case-media-inset case-media-inset--quiz-maker">
                        <VideoPlayer case-study
                          class="case-media-video"
                          src="/videos/quiz_fullscreen_teacher.mp4"
                        />
                      </div>
                      <figcaption class="case-media-caption">
                        Fig 6. Quiz maker for teachers to adopt new curriculum
                      </figcaption>
                    </figure>
                  </section>

                  <section class="constraint-story">
                    <div class="case-section__heading case-copy-block">
                        <h2>Students learn at their own pace with interactive material</h2>
                        <p>Students could ask open questions and get curriculum-relevant answers when teachers are overwhelmed or when self-studying.</p>
                    </div>

                    <figure class="case-media-figure">
                      <div class="case-media-frame case-media-frame--inset case-media-frame--practice-large">
                        <div class="case-media-inset case-media-inset--practice">
                          <VideoPlayer case-study
                            class="case-media-video"
                            src="/videos/nova_practice_V.mp4"
                          />
                        </div>
                      </div>
                      <figcaption class="case-media-caption">
                        Fig 8. Curriculum-based interactive practice quizzes
                      </figcaption>
                    </figure>
                  </section>
            </div>

            <figure class="case-media-figure product-gallery__card">
              <div class="case-media-frame case-media-frame--inset case-media-frame--uniform-video">
                <div class="case-media-inset case-media-inset--science-lab">
                  <img
                    class="case-media-content case-media-content--contain"
                    src="/images/case-studies/nova/os6oiUSyaNec8eLcKTRZfbAfbU.png"
                    alt="Nova Science Lab library of interactive PhET simulations"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <figcaption class="case-media-caption">
                Fig 7. PhET simulation labs for hands-on activities without equipment costs
              </figcaption>
            </figure>

            <figure class="case-media-figure product-gallery__card">
              <div class="case-media-frame case-media-frame--inset case-media-frame--uniform-video">
                <div class="case-media-inset case-media-inset--library">
                  <VideoPlayer case-study
                    class="case-media-video"
                    src="/videos/library.mp4"
                    aria-label="Searchable digital library demonstration"
                  />
                </div>
              </div>
              <figcaption class="case-media-caption">
                Fig 9. Searchable digital library over hyperlink dumps from other offline providers
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="constraints"
          class="case-section case-section--constraints"
          data-case-section="constraints"
        >
          <div class="constraint-story">
            <div class="case-section__heading">
              <h2>Affordable hardware limited LLM context, so we designed AI behavior to handle mid- to long-length conversations</h2>
              <p>
                The budget hardware lowered our LLM’s available tokens. Responses became
                slow after roughly five prompts because the AI parsed the entire chat history.
              </p>
            </div>
          </div>

          <div class="constraint-story">
            <div class="case-section__heading">
              <h2>Reduce friction by avoiding “new chat” every five prompts</h2>
              <p>
                Engineers expected users to press “new conversation” every five prompts,
                but the extra latency meant greater friction. For some students this would
                be their first experience on a computer, so context and “new chat” might not
                be understood.
              </p>
            </div>

            <figure class="case-media-figure case-media-figure--copy-width">
              <div class="case-media-frame case-media-frame--diagram">
                <img
                  class="case-media-content case-media-content--contain"
                  src="/images/case-studies/nova/skmMhXFzt2fG80ZwdfIGh1O1yTI-transparent.png"
                  alt="Frustrated journey showing long context leading to slow output and task abandonment"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 10. The original long-context journey ended in frustration and task abandonment.
              </figcaption>
            </figure>
          </div>

          <div class="constraint-story">
            <div class="case-section__heading">
              <h2>Instead of reading the entire history, check the relevance of prior questions</h2>
              <p>
                We implemented an AI relevance-checking system. A smaller model checks past
                prompts for relevance to the current prompt, then approves the larger model
                to read only useful context. This lowered computing power and sped up response generation.
              </p>
            </div>

            <figure class="case-media-figure case-media-figure--copy-width">
              <div class="case-media-frame case-media-frame--diagram">
                <img
                  class="case-media-content case-media-content--contain"
                  src="/images/case-studies/nova/oLkabsfhAzIBPjfCo4MF1C9NrqQ-transparent.png"
                  alt="Relevance-checking AI flow that reduces context and generates output faster"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption class="case-media-caption">
                Fig 11. A lightweight relevance check preserved context while generating faster responses.
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="result"
          class="case-section case-section--result"
          data-case-section="result"
        >
          <div class="case-section__heading">
            <h2>Shipped to South Sudan</h2>
            <p>
              Shipped to two schools for high school students. We ultimately passed the
              software to our nonprofit partner without the chance to collect longitudinal data.
            </p>
          </div>

          <figure class="case-media-figure case-media-figure--copy-width">
            <div class="case-media-frame">
              <img
                class="case-media-content case-media-content--cover"
                src="/images/case-studies/nova/u4vE6oS3396MmsZs0nLjVr396d8.png"
                alt="Students in South Sudan gathered around a laptop running Nova"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption class="case-media-caption">
              Fig 12. Students exploring Nova together after deployment in South Sudan.
            </figcaption>
          </figure>
        </section>

        <section
          id="learning"
          class="case-section case-section--learning"
          data-case-section="learning"
        >
          <h2>Learnings</h2>
          <ol class="case-numbered-list learning-list">
            <li>
              <div>
                <h3>Ask the dumbest questions</h3>
                <p>Designers often assume limitations into existence, hindering creative thinking in a startup environment.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>Think with the tech, not around it</h3>
                <p>Learning from engineers creates opportunities to design technical behaviors that influence user experience.</p>
              </div>
            </li>
            <li>
              <div>
                <h3>Push for research; nothing is fully gated</h3>
                <p>Partners on the ground were too busy to conduct student interviews for us, so we set up calls directly within their student network on WhatsApp.</p>
              </div>
            </li>
          </ol>
        </section>

        <section
          id="next-steps"
          class="case-section case-section--next-steps"
          data-case-section="next-steps"
        >
          <h2>Next steps</h2>
          <ol class="case-numbered-list next-steps-list">
            <li>
              <div>
                <p class="next-steps-list__action">Match test scores with Nova usage</p>
                <p>We had a USB drive that could track usage, but the shipment didn’t follow through. This was passed to the nonprofit tech team.</p>
              </div>
            </li>
            <li>
              <div>
                <p class="next-steps-list__action">Teacher and student interviews</p>
                <p>This required more on-the-ground coordination and was passed to our nonprofit partner as their responsibility.</p>
              </div>
            </li>
          </ol>
        </section>

        <section
          id="extra"
          class="case-section case-section--extra"
          data-case-section="extra"
        >
          <div class="case-section__heading case-copy-block">
            <h2>Extra</h2>
          </div>

          <figure class="case-media-figure">
            <div class="case-media-frame case-media-frame--video case-media-frame--extra-video">
              <VideoPlayer case-study
                class="case-media-video"
                src="/videos/nova_preview_quiz.mp4"
              />
            </div>
            <figcaption class="case-media-caption">
              Fig 13. Nova practice quiz experience.
            </figcaption>
          </figure>
        </section>
      </div>
    </div>
  </article>
</template>

<style scoped>
.nova-case {
  --case-copy-media-gap: var(--space-18);
  /* Shared narrative measure inherited from the Nuance case-study pattern. */
  --case-copy-width: var(--content-copy-width);
  --case-wide-copy-width: 1200px;
  --nova-existing-solution-image-size: 230px;
  --nova-overview-video-ratio: 3456 / 1940;
  --nova-problem-media-ratio: 2150 / 933;
  --nova-product-wide-video-ratio: 3454 / 1940;
  --nova-product-video-card-ratio: 706 / 607;
  --nova-practice-video-ratio: 1588 / 1288;
  --nova-science-lab-image-ratio: 3456 / 1944;
  --nova-library-video-ratio: 1960 / 1080;
  --nova-extra-video-ratio: 1920 / 1080;
  --nova-standard-media-ratio: 1075 / 607;
  --case-prototype-media-max-width: 1800px;
  width: 100%;
  padding: calc(var(--layout-header-clearance) + var(--space-m)) var(--layout-content-edge) var(--space-30);
  color: var(--color-text);
}

.nova-case__layout {
  position: relative;
  width: 100%;
  margin-inline: auto;
}


.case-content {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.case-section {
  width: min(var(--case-copy-width), 100%);
  scroll-margin-top: calc(var(--layout-header-clearance) + var(--space-m));
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.case-section--overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.case-section--overview h1 {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-regular);
  letter-spacing: -0.02em;
  line-height: var(--line-height-body);
}

.case-section__intro,
.case-section__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.case-section__approach {
  margin-top: var(--case-copy-media-gap);
}

.case-section h2 {
  margin: 0;
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-heading);
  letter-spacing: 0;
  line-height: var(--line-height-heading);
}

.case-section h3 {
  margin: 0;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-heading);
  letter-spacing: 0;
  line-height: var(--line-height-body);
}

.case-section p {
  margin: 0;
}

.case-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  color: var(--color-subdued);
  font-size: var(--font-size-s);
  line-height: var(--line-height-body);
}

.case-meta li:first-child {
  color: var(--color-text);
}

.case-media-figure {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.case-media-figure--overview {
  margin-top: var(--case-study-content-gap);
}

.case-media-figure--copy-width {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.case-media-frame {
  display: block;
  width: 100%;
  aspect-ratio: var(--nova-standard-media-ratio);
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--case-study-surface-radius);
  background: var(--color-media-background);
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.case-media-frame--problem {
  aspect-ratio: var(--nova-problem-media-ratio);
}

.case-media-frame--overview-video {
  aspect-ratio: var(--nova-overview-video-ratio);
}

.case-media-frame--product-wide-video {
  aspect-ratio: var(--nova-product-wide-video-ratio);
}

.case-media-frame--extra-video {
  aspect-ratio: var(--nova-extra-video-ratio);
}

.case-media-content {
  display: block;
  width: 100%;
  height: 100%;
  object-position: center;
}

.case-media-content--contain {
  object-fit: contain;
}

.case-media-video {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: contain;
  object-position: center;
}

.case-media-content--cover {
  object-fit: cover;
}

.case-media-frame--diagram {
  padding: var(--space-m);
}

.case-media-frame--hardware {
  padding: var(--space-xl);
}

.case-media-frame--inset {
  display: grid;
  aspect-ratio: auto;
  place-items: center;
  padding: var(--space-10);
}

.case-media-frame--uniform-video {
  aspect-ratio: var(--nova-product-video-card-ratio);
}

.case-media-inset {
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--case-study-surface-radius);
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.case-media-inset--quiz-maker {
  aspect-ratio: var(--nova-product-wide-video-ratio);
}

.case-media-inset--practice {
  aspect-ratio: var(--nova-practice-video-ratio);
}

/* Match Fig 6's outer height while fitting the taller practice video inside. */
@media (min-width: 768px) {
  .case-media-frame--practice-large {
    --practice-media-padding: var(--space-10);
    position: relative;
    aspect-ratio: var(--nova-product-wide-video-ratio);
  }

  .case-media-frame--practice-large > .case-media-inset {
    position: absolute;
    top: var(--practice-media-padding);
    left: 50%;
    width: auto;
    height: calc(100% - 2 * var(--practice-media-padding));
    transform: translateX(-50%);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .case-media-frame--practice-large {
    --practice-media-padding: var(--space-xl);
  }
}

.case-media-inset--science-lab {
  aspect-ratio: var(--nova-science-lab-image-ratio);
}

.case-media-inset--library {
  aspect-ratio: var(--nova-library-video-ratio);
}

.case-media-caption {
  width: min(var(--case-copy-width), 100%);
  margin-top: var(--space-xs);
  margin-inline: auto;
  color: var(--color-subdued);
  font-family: var(--font-mono-ui);
  font-size: var(--font-size-s);
  line-height: var(--line-height-body);
  text-align: left;
}

.case-section--problem,
.case-section--product {
  width: 100%;
  margin-top: var(--case-copy-media-gap);
}

.case-copy-block,
.case-section--product > .case-section__heading {
  width: min(var(--case-copy-width), 100%);
  margin-inline: auto;
}

.research-figure {
  display: flex;
  width: min(var(--case-copy-width), 100%);
  flex-direction: column;
  align-items: center;
  margin: var(--case-study-content-gap) auto 0;
}

.problem-details {
  display: flex;
  flex-direction: column;
  gap: var(--case-copy-media-gap);
  margin-top: var(--case-copy-media-gap);
}

.case-evidence-group,
.case-evidence {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.problem-media-story {
  display: flex;
  flex-direction: column;
  gap: var(--case-study-content-gap);
}

/* Match Nuance's heading-to-quote spacing; quote cards retain the compact gap. */
.case-evidence-group { gap: var(--case-study-content-gap); }

.evidence-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: var(--space-s) var(--space-m);
  border-radius: var(--case-study-surface-radius);
  background: var(--color-surface);
  color: var(--color-subdued);
}

.evidence-card blockquote {
  margin: 0;
  color: var(--color-text);
}

.evidence-card figcaption {
  color: var(--color-subdued);
  text-align: right;
}

.product-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-xl);
  margin-top: var(--case-study-content-gap);
}

.product-gallery__wide {
  grid-column: 1 / -1;
}

.product-gallery__interlude {
  display: flex;
  width: 100%;
  grid-column: 1 / -1;
  flex-direction: column;
  gap: var(--case-copy-media-gap);
  margin-inline: auto;
  padding-block: var(--space-12);
}

.product-gallery__card .case-media-caption {
  width: 100%;
}

.case-section--constraints {
  display: flex;
  flex-direction: column;
  gap: var(--case-copy-media-gap);
  margin-top: var(--case-copy-media-gap);
}

.constraint-story {
  display: flex;
  flex-direction: column;
  gap: var(--case-study-content-gap);
}

.existing-solution-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.existing-solution-media {
  display: grid;
  place-items: center;
}

.existing-solution-media img {
  width: min(var(--nova-existing-solution-image-size), 60%);
  height: auto;
}

.case-section--result {
  display: flex;
  flex-direction: column;
  gap: var(--case-study-content-gap);
  margin-top: var(--case-copy-media-gap);
}

.case-section--learning,
.case-section--next-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  margin-top: var(--case-copy-media-gap);
}

.case-section--extra {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--case-study-content-gap);
  margin-top: var(--case-copy-media-gap);
  padding-bottom: calc(var(--case-study-bottom-blur-height) + var(--space-xxxl));
}

.case-numbered-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.findings-list {
  counter-reset: finding;
}

.learning-list {
  counter-reset: learning;
}

.next-steps-list {
  counter-reset: next-step;
}

.case-numbered-list li {
  display: grid;
  grid-template-columns: var(--space-m) 1fr;
  align-items: baseline;
  gap: var(--space-s);
}

.findings-list li {
  counter-increment: finding;
}

.learning-list li {
  counter-increment: learning;
}

.next-steps-list li {
  counter-increment: next-step;
}

.findings-list li::before {
  content: counter(finding);
}

.learning-list li::before {
  content: counter(learning);
}

.next-steps-list li::before {
  content: counter(next-step);
}

.case-numbered-list li::before {
  font-weight: var(--font-weight-medium);
}

.case-numbered-list li > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: baseline;
  gap: var(--space-10);
}

.findings-list p,
.learning-list p,
.next-steps-list p:not(.next-steps-list__action) {
  color: var(--color-subdued);
}

.next-steps-list__action {
  font-size: var(--font-size-m);
}

@media (max-width: 1023px) {
  .nova-case {
    padding-top: var(--layout-header-clearance);
  }


  .case-media-frame--inset {
    padding: var(--space-xl);
  }
}

@media (min-width: 1601px) {
  .case-media-frame--video {
    width: min(100%, var(--case-prototype-media-max-width));
  }
}

@media (max-width: 767px) {
  .product-gallery {
    grid-template-columns: 1fr;
  }

  .product-gallery__wide {
    grid-column: auto;
  }

  .case-media-frame--inset {
    display: block;
    aspect-ratio: auto;
    padding: 0;
    background: transparent;
  }
}

@media (max-width: 639px) {
  .findings-list,
  .learning-list,
  .next-steps-list {
    gap: var(--space-xl);
  }

  .case-numbered-list li > div {
    grid-template-columns: 1fr;
    gap: var(--space-xs);
  }
}
</style>
