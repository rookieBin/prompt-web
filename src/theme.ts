import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

type ThemeMode = 'light' | 'dark';

export function getAntdTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark';

  const baseToken: ThemeConfig['token'] = {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    colorPrimary: '#a855f7',
    colorPrimaryHover: '#c084fc',
    colorPrimaryActive: '#9333ea',
    colorInfo: '#3b82f6',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',

    borderRadius: 12,
    borderRadiusLG: 14,
    borderRadiusSM: 10,

    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 32,

    lineWidth: 1,
    colorBorderSecondary: isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.16)',

    controlOutline: 'rgba(168, 85, 247, 0.14)',
    controlOutlineWidth: 3,

    boxShadow:
      '0 10px 30px rgba(15, 23, 42, 0.06), 0 2px 10px rgba(15, 23, 42, 0.04)',
    boxShadowSecondary:
      '0 6px 20px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
  };

  const paletteToken: ThemeConfig['token'] = isDark
    ? {
        colorBgBase: '#0a0a0f',
        colorBgContainer: '#12121a',
        colorBgElevated: '#1a1a24',
        colorBorder: 'rgba(168, 85, 247, 0.18)',
        colorText: 'rgba(255, 255, 255, 0.92)',
        colorTextSecondary: 'rgba(255, 255, 255, 0.62)',
        colorFillTertiary: 'rgba(255, 255, 255, 0.06)',
        colorFillSecondary: 'rgba(255, 255, 255, 0.08)',
        colorFill: 'rgba(255, 255, 255, 0.10)',
      }
    : {
        colorBgBase: '#f7f8fb',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBorder: 'rgba(168, 85, 247, 0.16)',
        colorText: 'rgba(15, 23, 42, 0.92)',
        colorTextSecondary: 'rgba(15, 23, 42, 0.62)',
        colorFillTertiary: 'rgba(2, 6, 23, 0.04)',
        colorFillSecondary: 'rgba(2, 6, 23, 0.06)',
        colorFill: 'rgba(2, 6, 23, 0.08)',
      };

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...baseToken,
      ...paletteToken,
    },
    components: {
      Button: {
        borderRadius: 12,
        borderRadiusSM: 10,
        controlHeight: 36,
        controlHeightLG: 40,
        paddingInline: 14,
        paddingInlineLG: 16,
        fontWeight: 600,
        primaryShadow: 'none',
        defaultShadow: 'none',
      },
      Input: {
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,
        activeShadow: '0 0 0 3px rgba(168, 85, 247, 0.12)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
      },
      InputNumber: {
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,
        activeShadow: '0 0 0 3px rgba(168, 85, 247, 0.12)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
      },
      Select: {
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,
        optionSelectedBg: isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.10)',
        optionActiveBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(2, 6, 23, 0.04)',
      },
      DatePicker: {
        borderRadius: 12,
        controlHeight: 36,
        controlHeightLG: 40,
        activeShadow: '0 0 0 3px rgba(168, 85, 247, 0.12)',
        hoverBorderColor: '#a855f7',
        activeBorderColor: '#a855f7',
      },
      Card: {
        borderRadiusLG: 16,
        paddingLG: 16,
        headerFontSize: 14,
      },
      Modal: {
        borderRadiusLG: 16,
      },
      Dropdown: {
        borderRadiusLG: 14,
      },
      Popover: {
        borderRadiusLG: 14,
      },
      Menu: {
        itemBorderRadius: 10,
        itemHeight: 40,
        itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(2, 6, 23, 0.04)',
        itemSelectedBg: isDark ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.12)',
        itemSelectedColor: isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)',
        // 关掉默认的 inline/vertical 右边框
        itemMarginInline: 0,
        itemMarginBlock: 0,
        // 直接覆盖主题 token，去掉边框
        colorSplit: 'transparent',
      },
      Pagination: {
        borderRadius: 12,
      },
    },
  };
}
