export interface Project {
  id: number
  title: string
  description: string[]
  duration: string
  aspect: string
  contentAspect?: string
  src: string
  type?: 'image'
  mediaBackgroundColor?: string
  mediaBackgroundImage?: string
  mediaBackgroundBlur?: boolean
  mediaBackgroundBrightness?: number
  compactMediaPadding?: boolean
  border?: boolean
  href?: string
  to?: string
  soon?: boolean
}

// Shared project order across homepage layout variants.
export const projects: Project[] = [
  { id: 13, title: 'Doordash', soon: true, description: ['Product design and Art direction', 'Intern'], duration: '2026', aspect: '1024 / 607', src: '/images/doordash.png', type: 'image', mediaBackgroundColor: '#ff3008', border: true },
  { id: 1, title: 'Nuance', description: ['Product design and 3D art', 'Concept'], duration: '2025', aspect: '3 / 4', contentAspect: '450 / 920', src: '/videos/asl-feature.mp4', mediaBackgroundImage: '/images/case-studies/nuance/fig-1-clouds.jpg', to: '/nuance' },
  { id: 6, title: 'Nova', description: ['Product design and Design PM', 'Full-time'], duration: '2024-2025', aspect: '1588 / 1288', src: '/videos/nova_practice_V.mp4', mediaBackgroundImage: '/images/home/media-backgrounds/nova.jpg', border: true, to: '/nova' },
  { id: 3, title: 'Manta', description: ['3D art and web design', 'Artwork'], duration: '2025', aspect: '3418 / 2032', src: '/videos/manta.mp4', mediaBackgroundImage: '/images/home/media-backgrounds/manta.jpg', mediaBackgroundBlur: true, mediaBackgroundBrightness: 1.25, href: 'https://manta-one.vercel.app/' },
  { id: 14, title: 'Fleetline', soon: true, description: ['Product design', 'Contract'], duration: '2026', aspect: '2984 / 2056', src: '/videos/fleetline.mp4', mediaBackgroundImage: '/images/home/media-backgrounds/fleetline.jpg', border: true },
  { id: 10, title: 'Haven', description: ['Product design and 3D concept', 'Contract'], duration: '2025', aspect: '1678 / 1080', src: '/images/haven.png', type: 'image', mediaBackgroundColor: '#e6e6e6', compactMediaPadding: true },
  { id: 2, title: 'Haven', description: ['Product design and 3D concept', 'Contract'], duration: '2025', aspect: '3 / 4', contentAspect: '1080 / 1920', src: '/videos/haven_3d.mp4', mediaBackgroundImage: '/images/home/media-backgrounds/haven-video.jpg', mediaBackgroundBlur: true },
  { id: 8, title: 'Rabbithole', soon: true, description: ['Product design', 'Concept'], duration: '2025', aspect: '2256 / 1464', src: '/videos/rabbithole.mp4', border: true },
  { id: 4, title: 'Gameboy', description: ['3D design and web design', 'Artwork'], duration: '2025', aspect: '3 / 4', contentAspect: '1080 / 1472', src: '/videos/gameboy.mp4', mediaBackgroundColor: '#000000', compactMediaPadding: true, href: 'https://gameboy-basic.vercel.app/' },
  { id: 7, title: 'Pen', description: ['Interaction design', 'Artwork'], duration: '2025', aspect: '2038 / 1008', src: '/videos/pen.mp4', mediaBackgroundColor: '#000000', compactMediaPadding: true },
  { id: 5, title: 'Wiggle', description: ['Interaction design', 'Concept'], duration: '2026', aspect: '1738 / 1000', src: '/videos/wiggle.mp4', mediaBackgroundColor: '#ffffff', compactMediaPadding: true, border: true, href: 'https://wiggle.framer.website/' },
  { id: 12, title: 'Chewsy', description: ['Product design', 'Concept'], duration: '2025', aspect: '1 / 1', src: '/videos/chewsy_createsc.mp4', mediaBackgroundColor: '#000000', compactMediaPadding: true },
  { id: 9, title: 'eVTOL', description: ['3D concept', 'Intern'], duration: '2023', aspect: '3274 / 1454', src: '/images/evtol.png', type: 'image', mediaBackgroundImage: '/images/home/media-backgrounds/evtol.jpg', mediaBackgroundBlur: true, mediaBackgroundBrightness: 0.55 },
  { id: 11, title: 'Watch', description: ['3D art', 'Artwork'], duration: '2022', aspect: '1920 / 1080', src: '/images/watch_3_4_view.png', type: 'image', mediaBackgroundImage: '/images/home/media-backgrounds/watch.jpg', mediaBackgroundBlur: true, mediaBackgroundBrightness: 0.55, border: true },
]
