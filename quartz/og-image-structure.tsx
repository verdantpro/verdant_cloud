/**
 * OG card layout for verdant: large 1-bit portrait (from static/icon.png via
 * iconBase64) on the left, title + description on the right. Square plate, no
 * circle crop — keeps the dither readable. Wired from quartz.ts via
 * ExternalPlugin.CustomOgImages({ imageStructure }).
 */
import { formatDate } from "@quartz-community/utils"
import { getDate } from "@quartz-community/utils/sort"
import type { QuartzPluginData } from "@quartz-community/types"
import type { SocialImageOptions } from "../.quartz/plugins"

type ThemeColors = {
  light: string
  lightgray: string
  gray: string
  darkgray: string
  dark: string
  secondary: string
  highlight: string
}

function fontName(spec: unknown): string {
  if (typeof spec === "string") return spec
  if (spec && typeof spec === "object" && "name" in spec) {
    return String((spec as { name: string }).name)
  }
  return "IBM Plex Mono"
}

export const portraitOgImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  description,
  fileData,
  iconBase64,
}) => {
  const { colorScheme } = userOpts
  const theme = cfg.theme as {
    colors: Record<string, ThemeColors>
    typography: { header: unknown; body: unknown }
  }
  const colors = theme.colors[colorScheme]
  const headerFont = fontName(theme.typography.header)
  const bodyFont = fontName(theme.typography.body)

  const longTitle = title.length > 28
  const rawDate = getDate(fileData as QuartzPluginData)
  const date = rawDate ? formatDate(rawDate, cfg.locale) : null
  const tags = (fileData.frontmatter?.tags as string[] | undefined) ?? []

  // 340px plate leaves room for padding in a ~440px left column on 1200×630
  const plate = 340

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        backgroundColor: colors.light,
        fontFamily: bodyFont,
      }}
    >
      {/* portrait column — cream ground matches favicon tile */}
      <div
        style={{
          display: "flex",
          width: 440,
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${colors.lightgray}`,
        }}
      >
        {iconBase64 ? (
          <img
            src={iconBase64}
            alt=""
            width={plate}
            height={plate}
            style={{
              // square, no circle — 1-bit dither stays blocky when scaled
              borderRadius: 0,
            }}
          />
        ) : null}
      </div>

      {/* text column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100%",
          padding: "2.75rem 2.5rem",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: colors.gray,
            marginBottom: "1.25rem",
            fontFamily: bodyFont,
          }}
        >
          {cfg.baseUrl}
        </div>

        <div
          style={{
            display: "flex",
            marginBottom: "1.25rem",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: longTitle ? 48 : 56,
              fontFamily: headerFont,
              fontWeight: 700,
              color: colors.dark,
              lineHeight: 1.15,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: colors.darkgray,
            lineHeight: 1.4,
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              margin: 0,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginTop: "auto",
          }}
        >
          {date ? (
            <div
              style={{
                display: "flex",
                color: colors.gray,
                fontSize: 22,
              }}
            >
              {date}
            </div>
          ) : null}
          {tags.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: "0.4rem",
                flexWrap: "wrap",
              }}
            >
              {tags.slice(0, 4).map((tag) => (
                <div
                  style={{
                    display: "flex",
                    padding: "0.35rem 0.7rem",
                    border: `1px solid ${colors.lightgray}`,
                    color: colors.gray,
                    fontSize: 20,
                    borderRadius: 2,
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
