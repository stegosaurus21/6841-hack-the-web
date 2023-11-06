import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
    plugins: [tsconfigPaths()],
    base: "/6841-hack-the-web/",
});
