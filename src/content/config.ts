import { defineCollection, z } from "astro:content";

const services = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    category: z.enum([
      "complex",
      "exterior",
      "interior",
      "polish",
      "detailing",
      "extra",
    ]),
    icon: z.string().default("car"),
    order: z.number().default(100),
    highlights: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const reviews = defineCollection({
  type: "content",
  schema: z.object({
    author: z.string(),
    rating: z.number().min(1).max(5).default(5),
    date: z.coerce.date(),
    car: z.string().optional(),
    order: z.number().default(100),
  }),
});

export const collections = { services, reviews };
