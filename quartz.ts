import * as ExternalPlugin from "./.quartz/plugins"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { portraitOgImage } from "./quartz/og-image-structure"

// Must run before loadQuartzConfig so the og-image factory merges this override.
// imageStructure cannot live in quartz.config.yaml (functions aren't valid YAML).
ExternalPlugin.CustomOgImages({
  imageStructure: portraitOgImage,
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
