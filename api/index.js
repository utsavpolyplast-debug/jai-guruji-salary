const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_KEY || '';

  let html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Inject keys as meta tags
  const meta = `<meta name="supa-url" content="${url}">
<meta name="supa-key" content="${key}">`;
  html = html.replace('</head>', meta + '\n</head>');

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.send(html);
};
