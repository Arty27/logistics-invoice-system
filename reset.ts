// generate-password.js
const argon2 = require('argon2');

async function main() {
  const password = 'Shambu123';

  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  console.log(hash);
}

main().catch(console.error);
