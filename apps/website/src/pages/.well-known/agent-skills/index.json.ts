import type { APIRoute } from 'astro';
import { getSkillMarkdown, skillDigest } from '../../../lib/skill-content';

export const prerender = true;

const SKILL_NAME = 'devicons';
const SKILL_DESCRIPTION =
  'Use @dev.icons/* — a collection of 1,200+ developer, brand, framework, and tooling SVG logos with React, Vue, and Svelte components. Covers installation, component usage, CDN URL generation, raw SVG access via @dev.icons/core, the icon catalog metadata, and variant selection. Use when working with developer logos, brand icons, framework marks, or when needing icon assets in SVG, font, or sprite format.';

export const GET: APIRoute = async () => {
  const body = await getSkillMarkdown();
  const digest = skillDigest(body);

  const index = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: SKILL_NAME,
        type: 'skill-md',
        description: SKILL_DESCRIPTION,
        url: '/.well-known/agent-skills/devicons/SKILL.md',
        digest,
      },
    ],
  };

  return new Response(JSON.stringify(index, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
