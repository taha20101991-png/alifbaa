const fs = require('fs');
const base = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!base || !/^https:\/\//i.test(base)) {
  console.error('Set SITE_URL to the real HTTPS domain, e.g. SITE_URL=https://example.com');
  process.exit(1);
}
const slugs = ['','learn/','privacy.html','learn/alif.html','learn/baa.html','learn/taa.html','learn/thaa.html','learn/jeem.html','learn/haa.html','learn/khaa.html','learn/daal.html','learn/thaal.html','learn/raa.html','learn/zaay.html','learn/seen.html','learn/sheen.html','learn/saad.html','learn/daad.html','learn/taa2.html','learn/zaa.html','learn/ain.html','learn/ghain.html','learn/faa.html','learn/qaaf.html','learn/kaaf.html','learn/laam.html','learn/meem.html','learn/noon.html','learn/haa2.html','learn/waw.html','learn/yaa.html'];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${slugs.map(p=>`  <url><loc>${base}/${p}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync('sitemap.xml', xml);
console.log('Created sitemap.xml for', base);
