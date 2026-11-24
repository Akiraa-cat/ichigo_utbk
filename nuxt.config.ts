import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';
import { ICHIGO_LOGO_URL } from './app/utils/subtests.js';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    appsScriptUrl: process.env.APPS_SCRIPT_URL || '',
    public: {},
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'ICHIGO | UTBK Study Journal',
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#D94A50' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        {
          name: 'description',
          content: 'Jurnal belajar dan pencatatan hasil tryout UTBK bergaya manga.',
        },
        { property: 'og:title', content: 'ICHIGO | UTBK Study Journal' },
        {
          property: 'og:description',
          content: 'Jurnal belajar dan pencatatan hasil tryout UTBK bergaya manga.',
        },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', href: ICHIGO_LOGO_URL },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
