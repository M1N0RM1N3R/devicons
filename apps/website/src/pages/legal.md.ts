import type { APIRoute } from 'astro';
import { markdownResponse } from '../lib/agent-md/response';

export const prerender = true;

export const GET: APIRoute = async () => {
  const year = new Date().getFullYear();
  const md = [
    '[Home](/index.md) › Legal',
    '',
    '# License and terms',
    '',
    '## License',
    '',
    'Devicons is released under the [MIT License](https://opensource.org/licenses/MIT). You can use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software without restriction, provided the copyright notice and permission notice are included in all copies or substantial portions of the software.',
    '',
    '```text',
    'MIT License',
    '',
    `Copyright (c) ${year} Devicons`,
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction, including without limitation the rights',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    'copies of the Software, and to permit persons to whom the Software is',
    'furnished to do so, subject to the following conditions:',
    '',
    'The above copyright notice and this permission notice shall be included in',
    'all copies or substantial portions of the Software.',
    '',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
    'SOFTWARE.',
    '```',
    '',
    '## Brand assets',
    '',
    'Each logo in the Devicons catalog belongs to the company, project, or product it represents. The Devicons license covers the packaging of those logos into the `@dev.icons/*` packages — it does not grant you rights to the brands themselves. Follow each brand\u2019s own trademark and logo-usage policy before using a logo in advertising, endorsements, or anything that could imply affiliation.',
    '',
    '## Privacy',
    '',
    'The Devicons website does not collect personal data. It does not use cookies for tracking, and it does not ship third-party analytics scripts to the browser.',
    '',
    '[Home](/index.md)',
  ].join('\n');

  return markdownResponse(md);
};
