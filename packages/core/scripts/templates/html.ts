export const html = (assets: string[]) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Devicons</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="./devicons.css" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        padding: 2rem;
        color: #333;
      }

      h1 {
        margin-bottom: 2rem;
        font-size: 2rem;
        font-weight: 600;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.5rem;
      }

      .preview {
        text-align: center;
        padding: 1rem;
        border-radius: 8px;
        background: #f5f5f5;
      }

      .inner {
        display: block;
        font-size: 4rem;
        margin-bottom: 0.5rem;
      }

      .label {
        font-size: 0.875rem;
        color: #666;
        word-break: break-word;
      }
    </style>
</head>
<body>

    <h1>Devicons</h1>

    <div class="grid grid-cols-4 gap-4">
    ${assets
      .map(
        (name) => `

        <div class="preview">
            <span class="inner">
                <i class="devicons devicons-${name}"></i>
            </span>
            <br>
            <span class='label'>${name}</span>
        </div>

    `
      )
      .join("\n")}
      </div>
</body>
</html>
    `;
};
