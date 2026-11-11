const fs = require('node:fs/promises');
const path = require('node:path');

const ASSETS = ['simposio-logo.webp', 'simposio-white-crisp.svg'];
const HOSTS = [
  'https://simposio-fenacef-2026.vercel.app',
  'https://simposio-fenacef-2026-n75c6u1w8-humanize2026.vercel.app'
];

async function asset(name) {
  try {
    const local = await fs.readFile(path.join(__dirname, 'assets', name));
    if (local.length > 1000) return local;
  } catch {}
  const failures = [];
  for (const host of HOSTS) {
    try {
      const response = await fetch(host + '/assets/' + name, {
        signal: AbortSignal.timeout(20000),
        headers: { 'Accept': 'image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8' }
      });
      const type = response.headers.get('content-type') || '';
      if (!response.ok || type.includes('text/html')) throw Error('Resposta inválida: HTTP ' + response.status + ' ' + type);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000) throw Error('Arquivo menor que o esperado');
      return bytes;
    } catch (error) {
      failures.push(host + ': ' + error.message);
    }
  }
  throw Error('Não foi possível obter o logotipo ' + name + '. ' + failures.join('; '));
}

(async () => {
  await fs.mkdir(path.join('public', 'assets'), { recursive: true });
  // A origem é o HTML validado em 11/11/2026, com 8 links do YouTube.
  for (const name of ASSETS) {
    await fs.writeFile(path.join('public', 'assets', name), await asset(name));
  }
  const html = await fs.readFile('index.html', 'utf8');
  const videos = ['ANcMUsWyR6o','2LWmWC_z3jI','oheP1OoRHNM','_o6LvG-_onE','p0b0TkGsKAE','RcIjpS8X7YU','6Yzi5Sbha-I','cyiN4-caVKg'];
  if (videos.some(id => !html.includes('https://www.youtube.com/watch?v=' + id))) throw Error('Falta link oficial de transmissão.');
  await fs.writeFile(path.join('public', 'index.html'), html);
  console.log('Guia FENACEF gerado: 8 links de transmissão e marcas preservadas.');
})().catch(err => { console.error(err); process.exit(1); });
