// Cards built in Warkah Kad never show the painted couple that two themes have in their scene art (Emas Diraja, Rumah Kaca): the customer's chosen models
// stand in their place, and if they chose none, this pair does. The pair suits the theme (the songket models for the Malay one).
// Plain data, shared by the themes, the builder's preview/publish code and the catalogue.
export const BUILDER_MODELS = {
  "royal-gold": { groom: "groom-2", bride: "bride-2" },     // Songket & Tanjak, and the songket kebaya
  glasshouse: { groom: "groom-3", bride: "bride-4" }        // black suit, lace gown
};

/** Fills the models of a DRAFT (before the sample is merged in, so the sample never chooses them). The models a builder card shows: the customer's choice for each person, else the theme's builder pair (none for themes that already have defaults). */
export function withBuilderModels(draft) {
  const pair = BUILDER_MODELS[draft.theme];
  if (!pair) return draft;
  draft.couple = { ...draft.couple, model: { groom: draft.couple?.model?.groom || pair.groom, bride: draft.couple?.model?.bride || pair.bride } };
  return draft;
}
