export const licence = (version: string) => `
/*!
 *  Devicons ${version} made by Theodore Vorillas / http://vorillaz.com 
 */
`;

export const fontBase = (hash: string) => `
@font-face {
  font-family: "Devicons";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url(./devicons.woff2?${hash}) format("woff2"),
    url(./devicons.ttf?${hash}) format("truetype");
}

.devicons {
  font-family: "devicons";
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.devicons {
  font-weight: 400;
}
`;

export const item = (name: string, unicode: string) => {
  return `
    .devicons-${name}:before {
      content: "${unicode}";
    }
  `;
};
