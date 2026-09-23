export interface Project {
  id: number
  title: string
  description: string[]
  duration: string
  aspect: string
  src: string
  type?: 'image'
  border?: boolean
  href?: string
}

// Shared project order across homepage layout variants.
export const projects: Project[] = [
  { id: 13, title: 'Doordash', description: ['Product design and Art direction', 'Intern'], duration: '2026', aspect: '1024 / 607', src: '/images/doordash.png', type: 'image', border: true },
  { id: 1, title: 'Nuance', description: ['Product design and 3D art', 'Concept'], duration: '2025', aspect: '1 / 1', src: '/videos/nuance_pure.mp4' },
  { id: 6, title: 'Nova', description: ['Product design and Design PM', 'Full-time'], duration: '2024-2025', aspect: '1588 / 1288', src: '/videos/nova_practice_V.mp4', border: true },
  { id: 3, title: 'Manta', description: ['3D art and web design', 'Artwork'], duration: '2025', aspect: '3418 / 2032', src: '/videos/manta.mp4', href: 'https://manta-one.vercel.app/' },
  { id: 14, title: 'Fleetline', description: ['Product design', 'Contract'], duration: '2026', aspect: '2984 / 2056', src: '/videos/fleetline.mp4', border: true },
  { id: 10, title: 'Haven', description: ['Product design and 3D concept', 'Contract'], duration: '2025', aspect: '1678 / 1080', src: '/images/haven.png', type: 'image' },
  { id: 2, title: 'Haven', description: ['Product design and 3D concept', 'Contract'], duration: '2025', aspect: '3 / 4', src: '/videos/haven_3d.mp4' },
  { id: 8, title: 'Rabbithole', description: ['Product design', 'Concept'], duration: '2025', aspect: '2256 / 1464', src: '/videos/rabbithole.mp4', border: true },
  { id: 4, title: 'Gameboy', description: ['3D design and web design', 'Artwork'], duration: '2025', aspect: '3 / 4', src: '/videos/gameboy.mp4', href: 'https://gameboy-basic.vercel.app/' },
  { id: 7, title: 'Pen', description: ['Interaction design', 'Artwork'], duration: '2025', aspect: '2038 / 1008', src: '/videos/pen.mp4' },
  { id: 5, title: 'Wiggle', description: ['Interaction design', 'Concept'], duration: '2026', aspect: '1738 / 1000', src: '/videos/wiggle.mp4', border: true, href: 'https://wiggle.framer.website/' },
  { id: 12, title: 'Chewsy', description: ['Product design', 'Concept'], duration: '2025', aspect: '1 / 1', src: '/videos/chewsy_createsc.mp4' },
  { id: 9, title: 'eVTOL', description: ['3D concept', 'Intern'], duration: '2023', aspect: '3274 / 1454', src: '/images/evtol.png', type: 'image' },
  { id: 11, title: 'Watch', description: ['3D art', 'Artwork'], duration: '2022', aspect: '1920 / 1080', src: '/images/watch_3_4_view.png', type: 'image', border: true },
]
