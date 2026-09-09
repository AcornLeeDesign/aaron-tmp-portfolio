export interface CaseStudyMetaItem {
  label: string
  value: string
}

export interface CaseStudyBlock {
  type: 'paragraph' | 'heading' | 'subheading' | 'quote' | 'stat' | 'list' | 'video' | 'callout' | 'image'
  text?: string
  attribution?: string
  items?: string[]
  src?: string
  caption?: string
}

export interface CaseStudySection {
  id: string
  title: string
  blocks: CaseStudyBlock[]
}

export interface CaseStudy {
  slug: string
  title: string
  role: string
  team: string[]
  timeline: string
  tools: string[]
  tags: string[]
  overview: string
  approach: string
  heroVideo: string
  heroImage?: string
  sections: CaseStudySection[]
}

export const CASE_STUDY_STORAGE_KEY = 'case-study-unlocked'

export const caseStudies: Record<string, CaseStudy> = {
  nova: {
    slug: 'nova',
    title: 'Nova',
    role: 'Founding Product Design Lead',
    team: ['Lauryn Kinsella', 'Devin Hayden', 'Teri Shim'],
    timeline: 'Oct 2024 – Feb 2025',
    tools: ['Figma'],
    tags: ['Product Design', 'UI/UX', 'Product Management'],
    overview: 'No-internet schools lack resources for quality education.',
    approach:
      'Nova: offline learning platform — a device that broadcasts an intranet, giving nearby devices access to an edge computed AI tutor and learning resources including Khan Academy and Ted Talks.',
    heroVideo: '/videos/nova_practice_V.mp4',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [
          {
            type: 'paragraph',
            text: 'No-internet schools lack resources for quality education.',
          },
          {
            type: 'paragraph',
            text: 'A handful of underfunded schools in South Sudan and Tanzania, educators complained about unreliable internet, insufficient materials, and difficulty keeping up with changing curriculums. These problems had prevented students from getting into secondary school and pursuing higher education.',
          },
        ],
      },
      {
        id: 'approach',
        title: 'Approach',
        blocks: [
          {
            type: 'subheading',
            text: 'Nova: offline learning platform',
          },
          {
            type: 'paragraph',
            text: 'A device that broadcasts an intranet (think WIFI), giving nearby devices access to an edge computed AI tutor and learning resources including Khan Academy and Ted Talks.',
          },
          {
            type: 'video',
            src: '/videos/nova_walkthrough.mp4',
            caption: 'Nova product walkthrough',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/vaJUQQ58BGdUA23xBmiEZ3TFz4.jpg',
            caption: 'Nova hardware kit — Guardian Inc device and tablet in a foam transit case.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/nWRXaqXcajtuakcfoVs5jX6POsY.jpg',
            caption: 'Assembling custom low-cost hardware for the offline Nova hub.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/zoLF9TkchFIf3TCL2FnY8WllVvY.jpg',
            caption: 'Early hardware/software workspace during Nova prototyping.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/1v9ZyAxK5zfghDE9kDxzWlBlq8.jpg',
            caption: 'The Nova team during a collaborative working session.',
          },
        ],
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        blocks: [
          {
            type: 'list',
            items: [
              'Shipped to Tanzania and South Sudan',
              'Collecting quantitative data in South Sudan',
              '100+ learning resources — open resource offline learning',
              '50+ devices can connect to Nova at once',
              'First locally-run AI tutor — trained on their curriculum, remotely update-able',
            ],
          },
          {
            type: 'callout',
            text: 'This case study focuses on design for students and teachers with low digital literacy while under high hardware constraints.',
          },
        ],
      },
      {
        id: 'initial-findings',
        title: 'Initial Findings',
        blocks: [
          {
            type: 'subheading',
            text: 'Limited technology + no internet = difficult independent learning.',
          },
          {
            type: 'quote',
            text: 'Computer labs are there, but there is no internet and no computers, so it just sat there and stopped me.',
            attribution: 'Said a high school senior',
          },
          {
            type: 'subheading',
            text: 'A Computer Lab with No Computers, No Internet',
          },
          {
            type: 'paragraph',
            text: 'There was a room labeled “computer lab”, yet it was collecting dust with no internet and no computers. Dirt floor, dusty, and it had a chair and an empty desk.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/JMiI4u7Mk720Mp1q22RWlLVwg.png',
            caption: 'A computer lab with no computers — empty, barred, and unused.',
          },
          {
            type: 'stat',
            text: '< 10% of students go to college',
            caption: 'The exam-based structure is cut-throat.',
          },
          {
            type: 'list',
            items: [
              'Insufficient teachers — Teachers are often underqualified and schools are understaffed.',
              'Outdated material — The government keeps changing curriculums, and teachers have a hard time keeping up.',
              'Unreliable/No Internet — Schools are underfunded and the government is concerned with internal conflict = No Starlink.',
            ],
          },
        ],
      },
      {
        id: 'educators',
        title: 'What Educators Say',
        blocks: [
          {
            type: 'subheading',
            text: 'Teachers Need More Resources',
          },
          {
            type: 'paragraph',
            text: 'Our non-profit partner LetAllGirls talked with an educator in Tanzania to learn about their current setup.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/uoM7V5kskgB89bMuNE27gLoVM.png',
            caption: 'Field research with educators — understanding classroom constraints on the ground.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/u4vE6oS3396MmsZs0nLjVr396d8.png',
            caption: 'Students and an educator gathered around a shared laptop during field research.',
          },
          {
            type: 'subheading',
            text: '01. Teachers lack material to accommodate all students.',
          },
          {
            type: 'quote',
            text: 'With 50 students in a class, it’s hard to satisfy with the material we have.',
            attribution: 'Director + teacher',
          },
          {
            type: 'paragraph',
            text: 'Not enough material to go around and limited technology to make up for it.',
          },
          {
            type: 'subheading',
            text: '02. Difficulty making material for new government curriculum.',
          },
          {
            type: 'quote',
            text: 'It would be great if we could make new quizzes based on the curriculum.',
          },
          {
            type: 'paragraph',
            text: '3+ schools were understaffed and had to create new material manually with outdated tools.',
          },
          {
            type: 'subheading',
            text: 'South Sudan',
          },
          {
            type: 'paragraph',
            text: 'We’ve want lab equipment for students to do hands-on, but we can’t afford that.',
          },
          {
            type: 'paragraph',
            text: 'Without lab equipment, they can’t do the groupwork described in the new curriculum.',
          },
          {
            type: 'callout',
            text: 'How do we bring quality, up-to-date resources to students + teachers and encourage curious exploration?',
          },
        ],
      },
      {
        id: 'solution',
        title: 'Solution',
        blocks: [
          {
            type: 'list',
            items: [
              'Curriculum-trained AI tutor — The tutor was to be dynamic with not only the curriculum but to each student’s education level.',
              'Quiz Generator — Help teachers focus on students rather than on constantly reviewing large syllabus updates.',
              'Phet Simulation Lab — Schools often couldn’t afford lab equipment, but teachers wanted to promote group work and hands-on activities.',
              'Searchable Digital Library — As opposed to the piles of hyperlinks provided by the RACHEL (only other offline database), our library had to be easy to navigate.',
              'Smart Companion — Ask about what’s on screen. No hopping tabs.',
            ],
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/os6oiUSyaNec8eLcKTRZfbAfbU.png',
            caption: 'Science Lab — searchable interactive simulations (PhET-style) for chemistry and biology.',
          },
          {
            type: 'video',
            src: '/videos/quiz_fullscreen_student.mp4',
            caption: 'Quiz experience for students',
          },
          {
            type: 'video',
            src: '/videos/quiz_fullscreen_teacher.mp4',
            caption: 'Quiz experience for teachers',
          },
        ],
      },
      {
        id: 'addressing-the-gap',
        title: 'Addressing the Gap',
        blocks: [
          {
            type: 'subheading',
            text: 'Existing solutions didn’t fuel curiosity',
          },
          {
            type: 'paragraph',
            text: 'Students hardly benefitted from existing offline databases due resources being dated and difficult to navigate.',
          },
          {
            type: 'subheading',
            text: 'Competitors are Outdated or Internet-reliant',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/GJnNV9JSeE9stEyxVU7oO7pv9Lw.png',
            caption: 'Nova vs. offline libraries vs. physical libraries — accessibility, cost, timeliness, and contextualization.',
          },
          {
            type: 'subheading',
            text: 'Online solutions',
          },
          {
            type: 'list',
            items: [
              'Assumes access everywhere.',
              'Relied on the fact that students had internet and devices at home, but it’s not the case.',
              'Unable to implement offline.',
              'Difficult to economically produce at scale.',
            ],
          },
          {
            type: 'subheading',
            text: 'Offline solutions',
          },
          {
            type: 'list',
            items: [
              'Outdated material, crappy navigation.',
              'Existing hardware only supported disorganized hyperlinks to content that wasn’t culture-relevant.',
            ],
          },
          {
            type: 'subheading',
            text: 'Existing workaround',
          },
          {
            type: 'paragraph',
            text: 'Students are curious to do their own research independently.',
          },
          {
            type: 'paragraph',
            text: 'Students borrow teachers’ phones just to Google search, despite poor connectivity.',
          },
        ],
      },
      {
        id: 'ux-under-pressure',
        title: 'UX Under Technical Pressure',
        blocks: [
          {
            type: 'paragraph',
            text: 'Navigating high technical constraints posed by edge computing.',
          },
          {
            type: 'paragraph',
            text: '(extremely low-cost, custom-built offline computer).',
          },
          {
            type: 'subheading',
            text: 'Ideal Platform vs. Necessary Features',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/DUxVZQ4HMJ4cDcJKYnWrbHAjHcE.png',
            caption: 'NEST whiteboard wall — scoping user flows, pedagogy, and necessary features with engineering.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/zs2LFf1nhgoYblfZiMkdm9bYRoA.png',
            caption: '“Necessary Features” close-up — educator tools vs. overall system requirements.',
          },
          {
            type: 'paragraph',
            text: 'Designers went crazy on whiteboards then discussed with engineers to narrow the scope.',
          },
          {
            type: 'paragraph',
            text: 'Found core features to focus on according to user needs.',
          },
          {
            type: 'paragraph',
            text: 'Less computing power for affordability = a sharp focus on providing value.',
          },
          {
            type: 'paragraph',
            text: 'We had to minimize the amount of “beautification” that would cost development time.',
          },
          {
            type: 'subheading',
            text: 'Matching problem to approach',
          },
          {
            type: 'paragraph',
            text: 'We matched each major problem with an approach.',
          },
          {
            type: 'paragraph',
            text: 'Matching the current structure, not disrupting or reinventing.',
          },
          {
            type: 'paragraph',
            text: 'Teachers were busy updating their material according to new syllabi, so we focused on integration with any teaching style and assignment.',
          },
        ],
      },
      {
        id: 'managing-ai',
        title: 'Managing AI Behavior',
        blocks: [
          {
            type: 'subheading',
            text: 'Hardware limited LLM context, so we designed backend for better UX',
          },
          {
            type: 'paragraph',
            text: 'Avoid hitting “new chat” every 5 prompts — less available tokens.',
          },
          {
            type: 'paragraph',
            text: 'The budget and hardware lowered our LLM’s available tokens. At first, we expected users to press “new conversation” every 5 prompts…',
          },
          {
            type: 'paragraph',
            text: 'Users would be frustrated at its forgetful nature.',
          },
          {
            type: 'subheading',
            text: 'Frustrated User Journey',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/skmMhXFzt2fG80ZwdfIGh1O1yTI.png',
            caption: 'Frustrated journey — long LLM context reads slow responses until students drop the task.',
          },
          {
            type: 'paragraph',
            text: 'This performance challenge would cost students to halt exploration or getting help on a project. With no room for a full onboarding or an account setup system, each student wouldn’t know the exact function of a simple “new conversation” button.',
          },
          {
            type: 'paragraph',
            text: 'I sat down with the lead engineer: Could we prevent the LLM from reading everything top-to-bottom to improve latency?',
          },
          {
            type: 'subheading',
            text: 'Success User Journey',
          },
          {
            type: 'subheading',
            text: 'A dumb relevance-checking AI',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/oLkabsfhAzIBPjfCo4MF1C9NrqQ.png',
            caption: 'Success journey — a lightweight relevance check returns Y/N so the smarter model can respond faster.',
          },
          {
            type: 'paragraph',
            text: 'We were able to implement an AI relevance-checking system. Funnily, we had a surplus of storage, so we added an additional “dumb” AI to check and return Y/N, using less computing power and speeding up response generation.',
          },
        ],
      },
      {
        id: 'cultural-context',
        title: 'Applying Cultural Context',
        blocks: [
          {
            type: 'subheading',
            text: 'Matching existing habits with similar design patterns',
          },
          {
            type: 'paragraph',
            text: 'I knew that given 1) their overall lower digital literacy and 2) their very different culture, we’d have to be intentional with each design decision. After interviewing teachers and students, we learned that they were familiar with WhatsApp.',
          },
          {
            type: 'paragraph',
            text: 'All ages were familiar with WhatsApp.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nova/gIdtS5E2zOKHZuEQRblwHshA.png',
            caption: 'Mapping WhatsApp familiarity — iconography, nav, and chat patterns students already know.',
          },
          {
            type: 'paragraph',
            text: 'We mimicked WhatsApp’s iconography to improve usability and lean on existing intuition.',
          },
        ],
      },
      {
        id: 'result',
        title: 'Result',
        blocks: [
          {
            type: 'paragraph',
            text: 'Shipped to 2 schools and 1 library for high school students! Unfortunately had to pass off all software to partner without collecting longitudinal data.',
          },
        ],
      },
      {
        id: 'reflection',
        title: 'Reflection',
        blocks: [
          {
            type: 'subheading',
            text: 'What I learned',
          },
          {
            type: 'list',
            items: [
              'Ask the dumbest questions — Because everyone ends up assuming limitations into existence, hindering creative thinking.',
              'Think with the tech, not around it. — Learning from engineers gives opportunity to design outside of the “technical box”, making limitations less rigid than imagined.',
              'Make, take, and present notes. — Documenting knowledge on all fronts such as LLM performance and stakeholder goals is key to team alignment and integrated design thinking at every step.',
            ],
          },
          {
            type: 'subheading',
            text: 'Looking Forward',
          },
          {
            type: 'list',
            items: [
              'Offline OS — With more funds it could allow learners and teachers to access Adobe Creative Suite, coding platforms, and more.',
              'Personalization — Make student/teacher accounts so the AI tutor and teachers can understand student progress.',
              'Edge-Computed AI — Without the technical constraints, AI that is computed in-house might be the next level of personalization and private security.',
            ],
          },
        ],
      },
    ],
  },

  nuance: {
    slug: 'nuance',
    title: 'Nuance',
    role: 'Product Designer',
    team: ['Jae Sung Park', 'Uyen Hoang'],
    timeline: '3-day design sprint',
    tools: ['Figma', 'Blender', 'After Effects'],
    tags: ['3D Prototyping', 'Design sprint', 'UI/UX'],
    overview: 'The deaf can’t hear emotion over the phone without video.',
    approach:
      'Nuance: call w/ emotional context — a mobile calling app that pairs animation with live captioning.',
    heroVideo: '/videos/nuance_pure.mp4',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [
          {
            type: 'paragraph',
            text: 'The deaf can’t hear emotion over the phone without video.',
          },
          {
            type: 'paragraph',
            text: 'Conversation is not the words we say—it’s the way we say them. A pause. A laugh. A shift in tone. A raised brow. These small cues carry big emotional weight.',
          },
          {
            type: 'paragraph',
            text: 'But what happens when those cues are stripped away? That’s what we realized when we spoke to members of the hard-of-hearing community:',
          },
          {
            type: 'callout',
            text: 'Captioning feels like an afterthought.',
          },
        ],
      },
      {
        id: 'approach',
        title: 'Approach',
        blocks: [
          {
            type: 'subheading',
            text: 'Nuance: call w/ emotional context',
          },
          {
            type: 'paragraph',
            text: 'A mobile calling app that pairs animation with live captioning.',
          },
          {
            type: 'video',
            src: '/videos/mock_call.mp4',
            caption: 'Mock call with emotional context',
          },
        ],
      },
      {
        id: 'outcomes',
        title: 'Outcomes',
        blocks: [
          {
            type: 'list',
            items: [
              'Introduced an expressive 3D character to give emotional cues — AI analyzes the caller’s tone and other subtle cues to animate the 3D character, communicating emotion.',
              'ASL video-to-text-to-speech — ASL will be translated to text then voice for the caller on the other end.',
            ],
          },
          {
            type: 'callout',
            text: 'This case study focuses on accessibility-first design.',
          },
        ],
      },
      {
        id: 'initial-findings',
        title: 'Initial Findings',
        blocks: [
          {
            type: 'subheading',
            text: 'Phone calls are a mess',
          },
          {
            type: 'paragraph',
            text: 'People don’t know how to communicate with the hard-of-hearing.',
          },
          {
            type: 'paragraph',
            text: 'The deaf often resort to messaging even with captions available.',
          },
          {
            type: 'quote',
            text: 'Can we do this over email?',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/hhXVv5f3RAhR53UA2VD89Vv1xM.png',
            caption: '“Deaf people requesting captions is equivalent to hearing people requesting audio…” — L. Friedmann',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/UIiWuDYeE7sOVMgF2RbLntIqDg.png',
            caption: 'POV: trying to do anything over the phone as a deaf person.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/GL9Tvyv15a7fg1CNGRCPsgHYi30.png',
            caption: '“Yes I’m deaf and can use the phone but…” — lived frustration shared online.',
          },
          {
            type: 'subheading',
            text: 'It’s not hard to find a shared problem',
          },
          {
            type: 'paragraph',
            text: 'Numerous deaf influencers complain about phone calls and captions as a necessity.',
          },
          {
            type: 'list',
            items: [
              'Not enough caption services — Imagine not understanding over 50% of what’s happening around you.',
              'Important calls are missed — Important calls get dropped.',
              'Only captions = less context. — Attitude, tone, and many other conversational nuances are lost.',
            ],
          },
          {
            type: 'stat',
            text: '60% of adults not confident interacting with the deaf.',
            caption:
              'YouGov survey commissioned by the Royal National Institute for Deaf people.',
          },
          {
            type: 'subheading',
            text: 'Captions miss the mark',
          },
          {
            type: 'paragraph',
            text: 'Current calling apps turn to texting, still losing the emotional clarity.',
          },
          {
            type: 'paragraph',
            text: 'Phone calls turn into bubbles. Captions don’t provide enough context in conversations.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/ax7n8AB2EfV1f9dt4EYyZk89gE.png',
            caption: 'Existing captioned-call UI (InnoCaption) — text transcripts without emotional cues.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/V2mHoJRDwCp2ne7mGcpNLK7o6I.png',
            caption: 'Existing captioned-call UI (Nagish) — SMS-style live transcripts still strip tone.',
          },
          {
            type: 'subheading',
            text: 'Call vs text',
          },
          {
            type: 'paragraph',
            text: 'The feeling of a real conversation is lost.',
          },
          {
            type: 'quote',
            text: 'I know what they’re saying, but I can’t feel how they’re saying it.',
          },
          {
            type: 'paragraph',
            text: 'The missing nuances in a conversation, from a soft chuckle to a frown, are crucial context clues. Sad? Giddy? Sarcastic?',
          },
          {
            type: 'callout',
            text: 'How do we bring the emotional cues of a real conversation into the calling experience?',
          },
        ],
      },
      {
        id: 'solution',
        title: 'Solution',
        blocks: [
          {
            type: 'paragraph',
            text: 'Combining visual emotional cues with captioning.',
          },
          {
            type: 'subheading',
            text: 'Before (iOS Concept) — Just text',
          },
          {
            type: 'paragraph',
            text: '(A mockup of what a standard captioned call feels like).',
          },
          {
            type: 'subheading',
            text: 'After — Captioning + emotional context',
          },
          {
            type: 'paragraph',
            text: 'A live captioning service is paired with an avatar so callers feel understood. Users can use ASL, similar to video calls.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/xZCnvvJztNC7VNKDndP3hQYTyk.gif',
            caption: 'After — Nuance contact/call UI with expressive 3D avatar + transcript.',
          },
          {
            type: 'video',
            src: '/videos/mood_set.mp4',
            caption: 'Emotional expression / mood set',
          },
          {
            type: 'subheading',
            text: 'Low Empathy',
          },
          {
            type: 'paragraph',
            text: 'Uyen: Can’t make it today Something urgent came up.',
          },
          {
            type: 'paragraph',
            text: 'Aaron: oh ok. (unaware she’s sad about it)',
          },
          {
            type: 'paragraph',
            text: 'Uyen: Sorry. I really wanted to see you.',
          },
          {
            type: 'paragraph',
            text: 'Aaron: yea... (thinks she might be making excuses)',
          },
          {
            type: 'subheading',
            text: 'Room for Empathy',
          },
          {
            type: 'paragraph',
            text: 'Uyen: Hey, Can’t make it today Something urgent came up.',
          },
          {
            type: 'paragraph',
            text: 'Aaron: No worries! I hope everything’s okay. (Sees sadness). Let me know if you want to talk later',
          },
          {
            type: 'paragraph',
            text: 'Uyen: Sorry. I really wanted to see you. I’ll call you in the evening!',
          },
          {
            type: 'paragraph',
            text: 'Aaron: Sure! Let’s catch up later then. (Sees affection)',
          },
        ],
      },
      {
        id: 'facial-expressions',
        title: 'Facial Expressions',
        blocks: [
          {
            type: 'paragraph',
            text: 'Without auditory cues, deaf people rely heavily on facial expressions.',
          },
          {
            type: 'paragraph',
            text: 'Animation: We can show facial expressions without video.',
          },
          {
            type: 'paragraph',
            text: 'Despite these being drawn in 2 seconds, you could already interpret each face’s emotion.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/WUfw8d3tyOVVsY6BdYpWp859g.png',
            caption: 'Quick emotion sketches — sad, neutral, happy — still readable at a glance.',
          },
          {
            type: 'subheading',
            text: 'Design for the future',
          },
          {
            type: 'paragraph',
            text: 'AI may evolve to be emotionally intelligent.',
          },
          {
            type: 'paragraph',
            text: 'AI may not accurately pick up emotions right now, but in the future, AI will be able to detect emotional signals.',
          },
          {
            type: 'subheading',
            text: '3D character expressions',
          },
          {
            type: 'paragraph',
            text: 'I modeled, rigged, and animated an avatar that changed expressions based on the tone, pacing, and other subtle nuances.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/PcEbG7s2j9CTtoWDt4emPSO2mAU.png',
            caption: '3D avatar expression — attentive / listening.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/xmCzNpFUgn2BFY6GDZfYxsafw.png',
            caption: '3D avatar expression — speaking / surprise.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/1Qelol0RuSbOtgvWRgdpque27ek.png',
            caption: '3D avatar expression — frustration (facepalm).',
          },
          {
            type: 'paragraph',
            text: 'The facial expressions aren’t easy to read; we need more clarity.',
          },
        ],
      },
      {
        id: 'layering-visual-cues',
        title: 'Layering Visual Cues',
        blocks: [
          {
            type: 'subheading',
            text: 'How can we maximize on sight being the most engaged sense?',
          },
          {
            type: 'paragraph',
            text: 'The more senses that are engaged, the more real the experience becomes. In the same vein, if we layer more sensory information given to the most active sense, sight, they’ll be able to more efficiently analyze context clues.',
          },
          {
            type: 'paragraph',
            text: 'We can give layer multiple visual emotional cues.',
          },
          {
            type: 'subheading',
            text: 'Multiple visual cues = clarity',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/MCnhlJhKTSdo4ZJNuNxHKwcnAxs.png',
            caption: 'Layering visual cues — captions + avatar expression, color, brightness, and depth.',
          },
          {
            type: 'paragraph',
            text: 'The more cues, the more natural the conversation will feel.',
          },
          {
            type: 'paragraph',
            text: 'Colorful expressions. Color is often directly linked to emotion, so we leveraged color as a visual cue for emotion, making facial expressions more easy to interpret.',
          },
          {
            type: 'subheading',
            text: 'User-defined color cues',
          },
          {
            type: 'paragraph',
            text: 'Colors can be interpreted differently.',
          },
          {
            type: 'paragraph',
            text: 'For example, red has different psychological interpretations across cultures. It can signify love, passion, anger, danger, excitement, and more.',
          },
          {
            type: 'callout',
            text: 'Key Insight: We must give users control over what colors mean.',
          },
          {
            type: 'paragraph',
            text: 'Color-emotion pairing: Users choose what colors mean to them.',
          },
          {
            type: 'paragraph',
            text: 'RAG would have to be quite insane for this to work, but I don’t doubt that it will be possible.',
          },
        ],
      },
      {
        id: 'interface',
        title: 'Interface Snapshots',
        blocks: [
          {
            type: 'subheading',
            text: 'Review recent + missed calls',
          },
          {
            type: 'paragraph',
            text: 'Not just plain text transcription, but emotional documentation as well.',
          },
          {
            type: 'image',
            src: '/images/case-studies/nuance/WIjWhImR5PK2eyxj5zDuaR6HM.png',
            caption: 'Review Important Calls — call history with full transcript context.',
          },
          {
            type: 'video',
            src: '/videos/recent_call.mp4',
            caption: 'Recent + missed calls',
          },
          {
            type: 'subheading',
            text: 'Home screen: Everything necessary consolidated.',
          },
          {
            type: 'paragraph',
            text: 'We decided that the navbar wasn’t necessary given the speedy product experience. People just want to make a call, not dig through pages.',
          },
          {
            type: 'video',
            src: '/videos/home_screen.mp4',
            caption: 'Home screen',
          },
        ],
      },
      {
        id: 'reflection',
        title: 'Reflection',
        blocks: [
          {
            type: 'subheading',
            text: 'What I learned',
          },
          {
            type: 'list',
            items: [
              'Layered cues/signifiers bring clarity. — Mashing different cues build an immersive experience. E.g. design for blind people could layer haptic + auditory cues.',
              'No need to design everything to communicate value. — 80% effort in divergent problem-thinking, not throw-away features.',
              'We take communication for granted. — Accessibility is a necessary human right, not another box that has to be ticked off.',
              'Designing with more than one form of sensory feedback. — In my future designs, I will look for ways to increase the number of senses involved in the experience.',
            ],
          },
        ],
      },
    ],
  },
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies[slug]
}
