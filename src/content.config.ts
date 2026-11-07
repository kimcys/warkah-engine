// The "form" every client file (events/<slug>/event.json) must fill in.
// If a required field is missing or wrong, the build stops with a message naming the field.
// Fields with .default(...) can be left out: the default text is used.
import { defineCollection, z } from "astro:content";
import modelLibrary from "../models/library.json";
import { glob } from "astro/loaders";

const html = z.string(); // may contain <br>, &amp;, &rsquo; ... (rendered as HTML)

// The choosable bride and groom figures (models/library.json). Leave a person out to use the theme's default, or its own artwork.
const modelIds = (who: string) => modelLibrary.models.filter((m) => m.who === who).map((m) => m.id) as [string, ...string[]];

const person = z.object({
  name: z.string(),              // "Muhammad Ezzan"
  full: z.string(),              // "bin Hj. Mohamed Eusop"
  short: z.string(),             // "Ezzan"  (hero, ribbon, portraits)
  parentsHtml: html,             // "Hj. Mohamed Eusop bin Indran<br>&amp; Hjh. Norsita binti Hj. Buang"
  role: z.string().optional()    // "Putera kepada" / "Puteri kepada"
});

const events = defineCollection({
  loader: glob({
    pattern: "*/event.json",
    base: "./events",
    generateId: ({ entry }) => entry.split("/")[0]
  }),
  schema: z.object({
    theme: z.enum(["royal-gold", "lover", "glasshouse", "enchanted-garden"]),
    package: z.enum(["signature", "custom"]).default("signature"),
    lang: z.string().default("ms"),

    hosting: z.object({
      site: z.string(),                       // Firebase Hosting site id → <site>.web.app
      project: z.string().optional(),         // defaults to the shared Warkah project
      domain: z.string().optional(),          // custom domain (host only), e.g. "aimanalyana.com"
      base: z.string().regex(/^\/(.*\/)?$/, "base must start and end with /").default("/")  // "/demo/royal-gold/" for catalogue demos
    }),

    // Where RSVPs / wishes / gifts are stored.
    //  mode "shared": Warkah project, under events/<slug>/ (default for new cards)
    //  mode "legacy": the card's own old Firebase project, root collections (Ezzan & Nadiah)
    //  mode "demo":   saved on the guest's phone only (catalogue demos)
    store: z.object({
      mode: z.enum(["shared", "legacy", "demo"]).default("shared"),
      firebaseConfig: z.record(z.string()).optional(),  // only for "legacy"
      localKey: z.string().optional()                   // keep an old card's on-phone storage names
    }).prefault({}),

    meta: z.object({
      title: z.string(),
      description: z.string(),
      shareDescription: z.string().optional(),
      ogImage: z.string().default("cover/og-preview.jpg"),   // "" = no preview image
      ogWidth: z.number().default(720),
      ogHeight: z.number().default(1560),
      ogAlt: z.string(),
      version: z.number().default(1)          // bump to refresh WhatsApp's cached preview
    }),

    couple: z.object({
      groom: person,
      bride: person,
      hashtag: z.string().optional(),
      first: z.enum(["groom", "bride"]).default("groom"),  // whose name comes first
      model: z.object({
        groom: z.enum(modelIds("groom")).optional(),
        bride: z.enum(modelIds("bride")).optional()
      }).optional()                                         // which figures stand on the groom and bride pages
    }),

    host: z.object({
      parents: z.array(z.string()).min(1).max(2),          // the inviting parents
      inviteRelation: z.string().default("ke majlis perkahwinan putera kami")
    }),

    date: z.object({
      start: z.string().datetime({ offset: true }),         // 2026-12-12T11:00:00+08:00
      end: z.string().datetime({ offset: true }),
      timeZone: z.string().default("Asia/Kuala_Lumpur")
    }),

    venue: z.object({
      name: z.string(),
      area: z.string(),                       // "Segamat, Johor"
      address: z.string(),                    // full address for calendars
      maps: z.string().url(),
      waze: z.string().url(),
      qrMaps: z.string().default("qr/google-maps.png"),     // "" = no QR shown
      qrWaze: z.string().default("qr/waze.png")
    }),

    aturcara: z.array(z.object({
      icon: z.enum(["makan", "pengantin", "bersurai", "akad", "doa", "jam"]).default("jam"),
      label: z.string(),
      time: z.string()
    })).min(1),

    music: z.object({
      src: z.string().default("audio/song.m4a"),
      type: z.string().default("audio/mp4"),
      fallback: z.object({ src: z.string(), type: z.string().default("audio/mpeg") }).optional(),   // second <source>, for browsers that cannot play the first
      title: z.string(),
      artist: z.string()
    }).optional(),

    portraits: z.object({
      groom: z.string().default("portrait/groom.webp"),
      bride: z.string().default("portrait/bride.webp")
    }).prefault({}),

    gallery: z.array(z.object({
      src: z.string(), width: z.number(), height: z.number(), alt: z.string()
    })).default([]),

    contacts: z.array(z.object({ name: z.string(), role: z.string(), phone: z.string() })).default([]),

    rsvp: z.object({
      maxGuests: z.number().int().min(1).max(10).default(2)
    }).prefault({}),

    features: z.object({
      mempelai: z.boolean().default(true),     // groom + bride pages
      portraits: z.boolean().default(true),
      gallery: z.boolean().default(true),
      doa: z.boolean().default(true),
      rsvp: z.boolean().default(true),
      wishes: z.boolean().default(true),
      gifts: z.boolean().default(false),        // add-on: Warkah Hadiah
      duitnow: z.boolean().default(false),      // add-on: DuitNow QR
      kenang: z.boolean().default(false),       // add-on: Warkah Kenang (photobooth + memory wall), button in the bottom bar
      ayat: z.boolean().default(false),
      venueSign: z.boolean().default(false),    // venue name on its own page         // Quran verse page (see `ayat` below)
      guestName: z.boolean().default(false)     // ?to=Name in the link (not sold; off)
    }).prefault({}),

    // Warkah Kenang link. The Kenang event defaults to this card's slug; set it only when they differ.
    kenang: z.object({ slug: z.string().optional() }).prefault({}),

    gifts: z.object({
      groupMinPrice: z.number().default(500),   // gifts above this (RM) can be shared
      shop: z.string().default("Shopee"),
      items: z.array(z.object({
        id: z.string().regex(/^g\d+$/, "gift ids must look like g1, g2, g3 ..."),
        name: z.string(), note: z.string(), price: z.string(), url: z.string().url()
      })).default([])
    }).prefault({}),

    duitnow: z.object({ image: z.string().default(""), accountName: z.string().default("") }).prefault({}),

    // Optional hand-drawn lettering (images in assets/) used instead of typed names / hashtag, e.g. the Lover card.
    art: z.object({ title: z.string().optional(), hashtag: z.string().optional() }).optional(),

    // Verse shown on the Ayat page (features.ayat). Defaults to Ar-Rum 30:21.
    ayat: z.object({
      ref: z.string().default("Surah Ar-Rum (30:21)"),
      arabic: z.string().default("…وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا"),
      malay: z.string().default("“Dan antara tanda tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan dari jenismu sendiri supaya kamu mendapat ketenangan daripadanya…”")
    }).prefault({}),

    // Optional dress-code page (Lover theme).
    dressCode: z.object({
      title: z.string().default("Tema Warna"),
      colors: z.array(z.object({
        label: z.string(),
        tone: z.enum(["blue", "pink"]).default("pink"),
        icon: z.enum(["shirt", "dress"]).default("shirt")
      })).min(1),
      note: z.string().optional()
    }).optional(),

    calendarDescription: z.string(),
    defaultWishes: z.array(z.object({ name: z.string(), message: z.string() })).default([
      { name: "Tetamu", message: "Tahniah. Semoga berbahagia hingga ke Jannah." },
      { name: "Keluarga", message: "Semoga majlis dipermudahkan dan diberkati Allah SWT." }
    ]),

    // Wording. Leave out to use these defaults.
    text: z.object({
      openingKicker: z.string().default("Walimatul Urus"),
      ribbonSmall: z.string().default("RAJA SEHARI"),
      heroKicker: z.string().default("Majlis Perkahwinan"),
      bismillah: z.string().default("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"),
      salam: z.string().default("Assalamualaikum WBT & Salam Sejahtera"),
      inviteHtml: html.default("Dengan penuh rasa kesyukuran ke hadrat Ilahi,<br>kami menjemput"),
      honorificsHtml: html.default("Dato&rsquo; Seri | Dato&rsquo; | Datin | Tuan | Puan | Encik | Cik"),
      venueHeading: z.string().default("Bertempat di"),
      qrLeadHtml: html.default("Sila imbas kod QR<br>untuk ke lokasi majlis"),
      doaLeadHtml: html.default("&ldquo;Ya Allah Ya Tuhan Kami.<br>Engkau berkatilah majlis ini dan satukanlah hati"),
      doaHtml: z.array(html).default([
        "Seperti Engkau satukan Adam dan Hawa, Yusof dan Zulaikha dan seperti Engkau satukan hati Muhammad S.A.W dan Siti Khadijah.",
        "Satukanlah hati kedua mempelai ini dengan iman keyakinan dan tawakal kepadaMu.",
        "Semoga kehidupan mereka dipenuhi Al-Mawaddah dan Al-Rahmah di dunia dan di akhirat&rdquo;"
      ]),
      rsvpDeadlineHtml: html.default("Kehadiran anda amat kami hargai.<br><strong>Sila sahkan kehadiran</strong>"),
      poem: z.array(z.string()).default([
        "Pelamin indah berseri cahaya,",
        "Busana raja sehari tersarung kemas,",
        "Doakan kami hidup bahagia,",
        "Dalam rahmat kasih yang ikhlas."
      ]),
      thanks: z.string().default("Semoga dengan kehadiran dan doa daripada para undangan yang dihormati akan menyerikan lagi majlis kami serta diberkati Allah S.W.T."),
      giftIntro: z.string().default("Doa dan kehadiran anda sudah cukup bermakna. Jika ingin memberi hadiah, berikut senarai yang kami perlukan.")
    }).prefault({})
  })
});

export const collections = { events };
