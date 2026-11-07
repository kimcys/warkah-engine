// The events collection: one events/<slug>/event.json per client, validated by the schema in src/lib/event-schema.ts.
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { eventSchema } from "./lib/event-schema";

const events = defineCollection({
  loader: glob({
    pattern: "*/event.json",
    base: "./events",
    generateId: ({ entry }) => entry.split("/")[0]
  }),
  schema: eventSchema
});

export const collections = { events };
