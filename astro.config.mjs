import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://adriaaante.github.io",
  base: "/avtomoyka-kolomenskaya-site",
  trailingSlash: "ignore",
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
  build: {
    assets: "_assets",
  },
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
});
