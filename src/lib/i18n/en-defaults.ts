// English wording for the couple-facing defaults in event.json (the `text` block, the default ayat, default wishes...).
// Used for an English card (lang "en") ONLY where the couple left the field at its Malay default; anything they typed is kept as typed.
// The Malay defaults themselves live in src/lib/event-schema.ts. A field with no entry here stays as it is (names, Arabic, titles).
export const EN_DEFAULTS: Record<string, unknown> = {
  "host.inviteRelation": "to the wedding of our son",
  "text.openingKicker": "The Wedding Celebration",
  "text.ribbonSmall": "KING & QUEEN FOR A DAY",
  "text.heroKicker": "Wedding Celebration",
  "text.salam": "Assalamualaikum WBT & Warmest Greetings",
  "text.inviteHtml": "With heartfelt gratitude to Allah,<br>we cordially invite",
  "text.venueHeading": "Held at",
  "text.qrLeadHtml": "Please scan the QR code<br>to find the venue",
  "text.doaLeadHtml": "&ldquo;O Allah, our Lord.<br>Bless this gathering and unite the hearts",
  "text.doaHtml": [
    "As You united Adam and Eve, Yusuf and Zulaikha, and as You united the hearts of Muhammad S.A.W and Siti Khadijah.",
    "Unite the hearts of this couple with faith, certainty and reliance upon You.",
    "May their life be filled with Al-Mawaddah and Al-Rahmah in this world and the hereafter&rdquo;"
  ],
  "text.rsvpDeadlineHtml": "Your presence is truly appreciated.<br><strong>Please confirm your attendance</strong>",
  "text.poem": [
    "The wedding dais glows with light,",
    "Royal robes for a day worn with grace,",
    "Pray that we live in happiness,",
    "In a mercy of sincere love."
  ],
  "text.thanks": "May the presence and prayers of our honoured guests grace our celebration and bring Allah's blessings.",
  "text.giftIntro": "Your prayers and presence are already more than enough. If you would like to give a gift, here is our wish list.",
  "ayat.malay": "“And among His signs is that He created for you mates from among yourselves, that you may find tranquillity in them…”",
  "dressCode.title": "Colour Theme",
  "defaultWishes": [
    { name: "Guest", message: "Congratulations. May you be happy all the way to Jannah." },
    { name: "Family", message: "May the event be made easy and blessed by Allah SWT." }
  ]
};
