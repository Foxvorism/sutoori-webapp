export interface MediaItem {
  id: string;
  title: string;
  caption: string;
  alt_text: string;
  category_id: string | null;
  media_type: "image" | "video";
  status: "draft" | "published" | "deleting";
  featured: boolean;
  sort_order: number;
  focal_x: number;
  focal_y: number;
  width: number;
  height: number;
  public_path: string | null;
  thumbnail_path: string | null;
  url?: string;
  thumbnail?: string;
  categories?: { name: string; slug: string } | null;
}
export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_media_id: string | null;
  sort_order: number;
  visible: boolean;
}
export interface Package {
  id: string;
  service_id: string | null;
  title: string;
  inclusions: string[];
  amount: number | null;
  currency: string;
  price_qualifier: string;
  sort_order: number;
  visible: boolean;
}
export interface GalleryResponse {
  items: MediaItem[];
  count: number;
  categories: { name: string; slug: string }[];
  unavailable: boolean;
}
export interface Settings {
  id: number;
  headline: string;
  supporting_copy: string;
  about: string;
  process: { title: string; description: string }[];
  whatsapp: string;
  message_template: string;
  email: string;
  instagram: string;
  contacts_verified: boolean;
  hero_media_id: string | null;
  showreel_media_id: string | null;
}
export const defaultSettings: Settings = {
  id: 1,
  headline: "Creating Stories. Timeless Moments.",
  supporting_copy:
    "Photography, film, and creative production — from the first idea to the final frame.",
  about:
    "Student-founded. Story-driven. We are a creative team bringing fresh perspectives to schools, campuses, communities, and brands across Bogor–Jabodetabek. From a fleeting moment to a lasting impression, we make it together.",
  process: [
    {
      title: "Discover",
      description:
        "Every story starts with a conversation. We align on your vision, audience, and the moments that matter.",
    },
    {
      title: "Create",
      description:
        "Ideas take shape. We develop the concept, design direction, and production plan.",
    },
    {
      title: "Produce",
      description:
        "Our team brings it to life — on set, on location, and behind the scenes.",
    },
    {
      title: "Deliver",
      description:
        "The finishing touches. Thoughtful editing and final output, ready for your next chapter.",
    },
  ],
  whatsapp: "",
  message_template: "Hi Sutoori! I'd like to discuss a project.",
  email: "",
  instagram: "https://www.instagram.com/sutoori.co/",
  contacts_verified: false,
  hero_media_id: null,
  showreel_media_id: null,
};
const serviceCopy = [
  [
    "Photography / Graduation Photoshoots",
    "Portraits, milestones, and the people behind them. Keep the feeling long after the day.",
  ],
  [
    "Sports Photography & Documentation",
    "The movement, the energy, the decisive moment. Stories from the sidelines and beyond.",
  ],
  [
    "Event Documentation",
    "Photography and video that hold on to the atmosphere, from the big stage to the small details.",
  ],
  [
    "Wedding Documentation",
    "Honest moments and considered images, woven into a story that is yours.",
  ],
  [
    "Videography & Company Profiles",
    "Purposeful moving images that introduce your people, your ideas, and your world.",
  ],
  [
    "Graphic Design",
    "A clear visual voice, from the first concept to the final design.",
  ],
  [
    "Yearbook Production",
    "A chapter worth keeping. Concept, photography, layout, and printed output where quoted.",
  ],
  [
    "On-site / Events Photobooth",
    "A little spontaneity. A shared memory. A photobooth experience made for your event.",
  ],
  [
    "Social Media Content & Motion Graphics",
    "Visual stories made to move, connect, and feel at home on your channels.",
  ],
];
export const defaultServices: Service[] = serviceCopy.map(
  ([name, description], i) => ({
    id: `default-${i}`,
    slug: `service-${i}`,
    name: name!,
    description: description!,
    cover_media_id: ["portfolio-graduation-female", "portfolio-sports-padel", "portfolio-family-gathering", "portfolio-wedding", null, null, "portfolio-yearbook", "portfolio-photobooth", null][i] || null,
    sort_order: i,
    visible: true,
  }),
);
export function whatsappLink(
  settings: Pick<
    Settings,
    "whatsapp" | "message_template" | "contacts_verified"
  >,
  context?: string,
) {
  if (!settings.contacts_verified || !/^[1-9]\d{7,14}$/.test(settings.whatsapp))
    return null;
  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.message_template + (context ? ` I'm interested in ${context}.` : ""))}`;
}
export const portfolioMedia: MediaItem[] = [
  ["Sports / Padel", "Sports", "sports", "sports-padel", 1920, 1280, "Two players on an indoor padel court"],
  ["Family Gathering", "Family Gathering", "family-gathering", "family-gathering", 1170, 650, "Family gathering participants enjoying an outdoor jeep ride"],
  ["Photobooth", "Photobooth", "photobooth", "photobooth", 1920, 1080, "An event photobooth with studio lights and a printed backdrop"],
  ["Engagement", "Engagement", "engagement", "engagement", 1920, 1280, "An engagement guest carrying a bouquet outside a house"],
  ["Yearbook", "Yearbook", "yearbook", "yearbook", 1920, 1280, "A group of students posing together around a table"],
  ["Wedding", "Wedding", "wedding", "wedding", 1920, 1066, "A close-up of a bride's embroidered outfit and hands"],
  ["Graduation", "Graduation", "graduation", "graduation-female", 1920, 1280, "A graduate in a dark hijab and red graduation sash standing beside a railing"],
].map(([title, category, slug, file, width, height, alt], i) => ({
  id: `portfolio-${file}`,
  title: String(title),
  caption: "",
  alt_text: String(alt),
  category_id: String(slug),
  categories: { name: String(category), slug: String(slug) },
  media_type: "image",
  status: "published",
  featured: true,
  sort_order: i,
  focal_x: 50,
  focal_y: 50,
  width: Number(width),
  height: Number(height),
  public_path: null,
  thumbnail_path: null,
  url: `/images/portfolio/${file}.webp`,
  thumbnail: `/images/portfolio/${file}-thumb.webp`,
}));
export const portfolioHero: MediaItem = {
  ...portfolioMedia.find((item) => item.category_id === "graduation")!,
  id: "hero-graduation",
  featured: false,
  alt_text: "A graduate jumping in a cap and gown outside a campus building",
  focal_x: 20,
  url: "/images/portfolio/graduation.webp",
  thumbnail: "/images/portfolio/graduation-thumb.webp",
};
