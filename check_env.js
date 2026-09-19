const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [k, ...vArr] = line.split('=');
  if(k && vArr.length > 0) {
    console.log(k.trim(), '=>', vArr.join('=').trim().replace(/^"|"$/g, ''));
  }
});
