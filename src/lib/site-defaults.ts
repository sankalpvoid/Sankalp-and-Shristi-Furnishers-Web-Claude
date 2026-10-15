/**
 * Central, editable site configuration. Everything here can be overridden from
 * Admin → Brand & contact (stored in the database). Items in [square brackets]
 * are deliberate placeholders — they are never invented facts.
 */
export interface MakingStage {
  id: string;
  title: string;
  caption: string;
  image: string; // optional real workshop photo URL; empty → illustrative artwork
}

export interface SiteSettings {
  brand: {
    name: string;
    tagline: string;
    logoText: string;
    logoImage: string; // replace without code: upload in admin or set a URL
    description: string;
  };
  contact: {
    phone: string;
    whatsapp: string; // digits with country code, e.g. 91XXXXXXXXXX
    email: string;
    address: string;
    mapUrl: string;
    hours: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  story: {
    legacyClaim: string;
    workshopStory: string;
    materialsStatement: string;
    guaranteeHeadline: string;
    guaranteeNote: string;
    sleepwellText: string;
    showroomIntro: string;
  };
  hero: { image: string; imageAlt: string };
  making: MakingStage[];
  flags: {
    legacyClaimVerified: boolean;
    guaranteeVerified: boolean;
    contactVerified: boolean;
  };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: "Sankalp & Shristi Furnishers",
    tagline: "Crafted for Living",
    logoText: "SSFI",
    logoImage: "",
    description:
      "A furniture showroom with its own workshop. We make custom furniture and sell ready-made pieces — beds, sofas, dining sets and mattresses — and you can see, touch and talk through every design in person.",
  },
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    mapUrl: "",
    hours: "",
    instagram: "",
    facebook: "",
    youtube: "",
  },
  story: {
    legacyClaim:
      "Our showroom is the oldest furniture showroom on Ring Road, and the first to open in this market.",
    workshopStory:
      "Every custom piece starts in our own workshop. We work with solid teak for our solid-teak furniture, and we build to the size, finish and fabric you choose.",
    materialsStatement:
      "Our solid-teak furniture is made from solid teak wood, not particleboard or plywood. Materials differ by product, so each product page states what that piece is made from.",
    guaranteeHeadline: "Five-year guarantee",
    guaranteeNote:
      "Ask the team what the guarantee covers for the piece you are considering.",
    sleepwellText:
      "We are a Sleepwell partner. Come and try the mattresses we offer — the right mattress is half of a good bed.",
    showroomIntro:
      "Furniture is easier to choose when you can sit on it, run a hand along the wood and talk through the details. Our showroom is the place to do that.",
  },
  hero: { image: "", imageAlt: "An illustrative interior with a sofa and teak furniture" },
  making: [
    { id: "wood", title: "Raw wood", caption: "It begins with timber, chosen and seasoned before anything is cut.", image: "" },
    { id: "cut", title: "Measure and cut", caption: "Planks are marked to size, then cut and planed true.", image: "" },
    { id: "build", title: "Build and assemble", caption: "Joints are cut and fitted, and the frame takes shape.", image: "" },
    { id: "foam", title: "Foam and cushioning", caption: "Seats and backs are padded for comfort that lasts.", image: "" },
    { id: "fabric", title: "Fabric and upholstery", caption: "Fabric is chosen with you, then cut, stitched and fitted.", image: "" },
    { id: "finish", title: "Finish and detail", caption: "Sanding, staining and polishing bring out the grain.", image: "" },
    { id: "home", title: "Ready for your home", caption: "The finished piece, made to be lived with.", image: "" },
  ],
  flags: { legacyClaimVerified: false, guaranteeVerified: false, contactVerified: false },
};

export const PLACEHOLDER = {
  phone: "[Phone number to be added]",
  email: "[Email address to be added]",
  address: "[Showroom address to be added]",
  hours: "[Opening hours to be added]",
  whatsapp: "[WhatsApp number to be added]",
};
