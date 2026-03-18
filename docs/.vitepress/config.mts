import { defineConfig } from 'vitepress'
import { version } from '../../package.json'

export default defineConfig({
  base: '/llm-spend-guard/',
  title: 'llm-spend-guard',
  description: 'Enforce real-time token budgets and spending limits for OpenAI, Anthropic Claude, and Google Gemini API calls in Node.js',
  head: [
    ['meta', { name: 'keywords', content: 'llm token budget, openai spending limit, anthropic cost control, gemini api budget, nodejs ai cost management, gpt-4 rate limit' }],
    ['meta', { property: 'og:title', content: 'llm-spend-guard — Real-time LLM Token Budget Guard' }],
    ['meta', { property: 'og:description', content: 'Stop your LLM API bills from spiraling. Enforce token budgets for OpenAI, Anthropic Claude & Google Gemini.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'llm-spend-guard — Real-time LLM Token Budget Guard' }],
    ['meta', { name: 'twitter:description', content: 'Stop your LLM API bills from spiraling. Enforce token budgets for OpenAI, Anthropic Claude & Google Gemini.' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'llm-spend-guard',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js',
      description: 'Enforce real-time token budgets for OpenAI, Anthropic Claude, and Google Gemini API calls',
      url: 'https://ali-raza-arain.github.io/llm-spend-guard/',
      downloadUrl: 'https://www.npmjs.com/package/llm-spend-guard',
      softwareVersion: version,
      license: 'https://opensource.org/licenses/MIT',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      programmingLanguage: 'TypeScript',
    })],
  ],
  sitemap: {
    hostname: 'https://ali-raza-arain.github.io/llm-spend-guard/',
  },
  themeConfig: {
    nav: [
      { text: `v${version}`, link: 'https://github.com/Ali-Raza-Arain/llm-spend-guard/blob/main/CHANGELOG.md' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/guide/api-reference' },
      { text: 'npm', link: 'https://www.npmjs.com/package/llm-spend-guard' },
      { text: 'GitHub', link: 'https://github.com/Ali-Raza-Arain/llm-spend-guard' },
      { text: 'Sponsor', link: 'https://buymeacoffee.com/alirazaarain' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Why llm-spend-guard?', link: '/guide/why' },
          { text: 'Getting Started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Providers',
        items: [
          { text: 'OpenAI Token Limits', link: '/guide/openai-token-limit' },
          { text: 'Anthropic Claude Cost Control', link: '/guide/anthropic-cost-control' },
          { text: 'Google Gemini Budget', link: '/guide/gemini-budget' },
        ],
      },
      {
        text: 'Integration',
        items: [
          { text: 'Express.js Middleware', link: '/guide/express-middleware' },
          { text: 'Next.js API Routes', link: '/guide/nextjs-integration' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/guide/api-reference' },
          { text: 'Comparison', link: '/guide/comparison' },
        ],
      },
      {
        text: 'About',
        items: [
          { text: 'Roadmap', link: '/guide/roadmap' },
          { text: 'Credits & Sponsor', link: '/guide/credits' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ali-Raza-Arain/llm-spend-guard' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Made by <a href="https://github.com/Ali-Raza-Arain">Ali Raza</a>',
    },
  },
})
