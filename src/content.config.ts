import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const podcast = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/podcast' }),
  schema: z.object({
    title: z.string(),
    episodeNumber: z.number().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    duration: z.string(),
    audioUrl: z.string().url(),
    episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
    season: z.number().default(1),
    explicit: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    isFriday: z.boolean().default(false),
  }),
});

export const collections = { podcast };
