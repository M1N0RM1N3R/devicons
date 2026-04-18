import corePkg from '../../../../packages/core/package.json';
import fontPkg from '../../../../packages/font/package.json';

export const FONT_PKG_NAME = fontPkg.name;
export const FONT_PKG_VERSION = fontPkg.version;

export const CORE_PKG_NAME = corePkg.name;
export const CORE_PKG_VERSION =
  corePkg.version === '0.0.0' ? 'latest' : corePkg.version;
