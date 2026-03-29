const pages = {
  introduction: {
    title: "Introduction",
    toc: ["Overview", "Features", "Packages", "Why EasyAuth?"],
    content: `
      <span class="intro-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Self-hosted passwordless authentication
      </span>
      <h1>EasyAuth</h1>
      <p class="lead">A modern, framework-agnostic passwordless authentication engine for Node.js, Next.js, and Flutter. Built for self-hosting with complete data ownership.</p>
      
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4>Email OTP</h4>
            <p>Secure, cryptographically generated 6-digit passcodes sent via SMTP.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4>TOTP 2FA</h4>
            <p>RFC-6238 compliant authenticator app support (Google Authenticator, Authy).</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4>Session Management</h4>
            <p>Lightweight, stateless JWT sessions with configurable expiration.</p>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div class="feature-content">
            <h4>Brute Force Protection</h4>
            <p>Native exponential backoffs and temporary account locking.</p>
          </div>
        </div>
      </div>

      <h2 id="packages">Packages</h2>
      <p>This repository is managed as a pnpm workspace containing independent packages:</p>

      <div class="package-grid">
        <div class="package-item">
          <code>@easy-auth/core</code>
          <p>The backend engine handling cryptography, token generation, and SMTP dispatching.</p>
        </div>
        <div class="package-item">
          <code>@easy-auth/adapter-sqlite</code>
          <p>Official SQLite storage adapter using better-sqlite3.</p>
        </div>
        <div class="package-item">
          <code>@easy-auth/adapter-redis</code>
          <p>Official Redis storage adapter for distributed edge scaling.</p>
        </div>
        <div class="package-item">
          <code>@easy-auth/adapter-mongo</code>
          <p>Official MongoDB adapter with TTL index support.</p>
        </div>
        <div class="package-item">
          <code>@easy-auth/react</code>
          <p>Drop-in AuthModal UI component for React applications.</p>
        </div>
        <div class="package-item">
          <code>easy_auth_flutter</code>
          <p>Native mobile Dart/Flutter authentication widget.</p>
        </div>
      </div>

      <h2 id="why-easyauth">Why EasyAuth?</h2>
      <p>Unlike third-party authentication services, EasyAuth runs entirely on your infrastructure:</p>
      <ul>
        <li><strong>No vendor lock-in</strong> - Your data never leaves your servers</li>
        <li><strong>Zero telemetry</strong> - No analytics, no tracking, no surprises</li>
        <li><strong>Modular architecture</strong> - Only bundle what you need</li>
        <li><strong>Database agnostic</strong> - Works with SQLite, Redis, or MongoDB</li>
        <li><strong>Framework neutral</strong> - Express, Next.js, Fastify, or raw Node.js</li>
      </ul>

      <div class="callout">
        <strong>Production ready</strong> — EasyAuth uses battle-tested cryptography (bcrypt, AES-256-GCM, HKDF) and implements timing-safe comparisons throughout.
      </div>
    `,
  },

  installation: {
    title: "Installation",
    toc: ["Requirements", "Install Packages", "Environment Variables"],
    content: `
      <h1>Installation</h1>
      <p class="lead">Get up and running with EasyAuth in your project.</p>

      <h2 id="requirements">Requirements</h2>
      <ul>
        <li>Node.js 18.0 or higher</li>
        <li>npm, yarn, or pnpm</li>
        <li>An SMTP server for sending emails</li>
        <li>A database (SQLite, Redis, or MongoDB)</li>
      </ul>

      <h2 id="install-packages">Install Packages</h2>
      <p>Install the core package and a storage adapter:</p>

      <pre><code><span class="token comment"># Using npm</span>
npm install @easy-auth/core @easy-auth/adapter-sqlite

<span class="token comment"># Using pnpm (recommended)</span>
pnpm add @easy-auth/core @easy-auth/adapter-sqlite

<span class="token comment"># Using yarn</span>
yarn add @easy-auth/core @easy-auth/adapter-sqlite</code></pre>

      <p>Available storage adapters:</p>
      <table>
        <thead>
          <tr>
            <th>Adapter</th>
            <th>Package</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SQLite</td>
            <td><code>@easy-auth/adapter-sqlite</code></td>
            <td>Development, single-process apps</td>
          </tr>
          <tr>
            <td>Redis</td>
            <td><code>@easy-auth/adapter-redis</code></td>
            <td>Multi-process, distributed deployments</td>
          </tr>
          <tr>
            <td>MongoDB</td>
            <td><code>@easy-auth/adapter-mongo</code></td>
            <td>Teams already using MongoDB</td>
          </tr>
        </tbody>
      </table>

      <h2 id="environment-variables">Environment Variables</h2>
      <p>Configure EasyAuth using environment variables. Create a <code>.env</code> file in your project root:</p>

      <pre><code><span class="token comment"># Required</span>
<span class="token property">JWT_SECRET</span>=<span class="token string">your-secret-key-at-least-32-characters-long</span>

<span class="token comment"># SMTP Configuration</span>
<span class="token property">SMTP_HOST</span>=<span class="token string">smtp.example.com</span>
<span class="token property">SMTP_PORT</span>=<span class="token string">587</span>
<span class="token property">SMTP_USER</span>=<span class="token string">your-smtp-username</span>
<span class="token property">SMTP_PASS</span>=<span class="token string">your-smtp-password</span>
<span class="token property">SMTP_FROM</span>=<span class="token string">Your App &lt;noreply@example.com&gt;</span>

<span class="token comment"># Optional: Database (for SQLite, this is the file path)</span>
<span class="token property">DATABASE_URL</span>=<span class="token string">./auth.db</span></code></pre>

      <div class="callout warning">
        <strong>Security note:</strong> Never commit your <code>.env</code> file to version control. Add it to your <code>.gitignore</code>.
      </div>
    `,
  },

  quickstart: {
    title: "Quick Start",
    toc: [
      "1. Set up the backend",
      "2. Create API routes",
      "3. Add the frontend",
      "Next steps",
    ],
    content: `
      <h1>Quick Start</h1>
      <p class="lead">Have a working authentication system in under 5 minutes.</p>

      <div class="steps">
        <div class="step">
          <h3 id="setup-backend">1. Set up the backend</h3>
          <p>Create an Express server with EasyAuth configured:</p>
          <div class="code-block">
            <span class="filename">server.js</span>
            <pre><code><span class="token keyword">import</span> express <span class="token keyword">from</span> <span class="token string">'express'</span>;
<span class="token keyword">import</span> { createAuth } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;
<span class="token keyword">import</span> { sqliteAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/adapter-sqlite'</span>;

<span class="token keyword">const</span> app = express();
app.<span class="token function">use</span>(express.<span class="token function">json</span>());

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  smtp: {
    host: process.<span class="token property">env</span>.<span class="token property">SMTP_HOST</span>,
    port: <span class="token number">587</span>,
    secure: <span class="token boolean">false</span>,
    auth: {
      user: process.<span class="token property">env</span>.<span class="token property">SMTP_USER</span>,
      pass: process.<span class="token property">SMTP_PASS</span>,
    },
    <span class="token property">from</span>: process.<span class="token property">env</span>.<span class="token property">SMTP_FROM</span>,
  },
  jwt: {
    secret: process.<span class="token property">env</span>.<span class="token property">JWT_SECRET</span>,
    expiresIn: <span class="token string">'7d'</span>,
  },
  store: <span class="token function">sqliteAdapter</span>(<span class="token string">'./auth.db'</span>),
});

app.<span class="token function">listen</span>(<span class="token number">3000</span>, () => console.<span class="token function">log</span>(<span class="token string">'Server running'</span>));</code></pre>
          </div>
        </div>

        <div class="step">
          <h3 id="api-routes">2. Create API routes</h3>
          <p>Add endpoints for sending and verifying OTPs:</p>
          <div class="code-block">
            <span class="filename">server.js</span>
            <pre><code><span class="token comment">// Send OTP to email</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/send-otp'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> { email } = req.<span class="token property">body</span>;
  
  <span class="token keyword">try</span> {
    <span class="token keyword">await</span> auth.<span class="token function">sendOTP</span>(email);
    res.<span class="token function">json</span>({ <span class="token property">ok</span>: <span class="token boolean">true</span> });
  } <span class="token keyword">catch</span> (error) {
    res.<span class="token function">status</span>(error.<span class="token property">status</span> || <span class="token number">400</span>).<span class="token function">json</span>({ 
      <span class="token property">code</span>: error.<span class="token property">code</span> || <span class="token string">'ERROR'</span> 
    });
  }
});

<span class="token comment">// Verify OTP and issue session token</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/verify-otp'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> { email, code } = req.<span class="token property">body</span>;
  
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> result = <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(email, code);
    res.<span class="token function">json</span>(result);
  } <span class="token keyword">catch</span> (error) {
    res.<span class="token function">status</span>(error.<span class="token property">status</span> || <span class="token number">401</span>).<span class="token function">json</span>({ 
      <span class="token property">code</span>: error.<span class="token property">code</span> || <span class="token string">'ERROR'</span> 
    });
  }
});

<span class="token comment">// Get current user from token</span>
app.<span class="token function">get</span>(<span class="token string">'/api/auth/me'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> token = req.<span class="token property">headers</span>.<span class="token property">authorization</span>?.<span class="token function">split</span>(<span class="token string">' '</span>)[<span class="token number">1</span>];
  
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> user = <span class="token keyword">await</span> auth.<span class="token function">verifyToken</span>(token);
    res.<span class="token function">json</span>({ user });
  } <span class="token keyword">catch</span> (error) {
    res.<span class="token function">status</span>(<span class="token number">401</span>).<span class="token function">json</span>({ <span class="token property">code</span>: error.<span class="token property">code</span> });
  }
});</code></pre>
          </div>
        </div>

        <div class="step">
          <h3 id="add-frontend">3. Add the frontend</h3>
          <p>Install and use the React component:</p>
          <pre><code>pnpm add @easy-auth/react</code></pre>
          <div class="code-block">
            <span class="filename">App.tsx</span>
            <pre><code><span class="token keyword">import</span> { AuthModal } <span class="token keyword">from</span> <span class="token string">'@easy-auth/react'</span>;
<span class="token keyword">import</span> { useState } <span class="token keyword">from</span> <span class="token string">'react'</span>;

<span class="token keyword">function</span> <span class="token function">App</span>() {
  <span class="token keyword">const</span> [showAuth, setShowAuth] = <span class="token function">useState</span>(<span class="token boolean">false</span>);

  <span class="token keyword">return</span> (
    <span class="token operator">&lt;</span><span class="token property">div</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token property">button</span> <span class="token property">onClick</span>={<span class="token function">()</span> =&gt; setShowAuth(<span class="token boolean">true</span>)}<span class="token operator">&gt;</span>
        Sign In
      <span class="token operator">&lt;/</span><span class="token property">button</span><span class="token operator">&gt;</span>

      {showAuth &amp;&amp; (
        <span class="token operator">&lt;</span><span class="token property">AuthModal</span>
          <span class="token property">apiBaseUrl</span>={<span class="token string">'/api/auth'</span>}
          <span class="token property">onSuccess</span>={({ token, user }) =&gt; {
            console.<span class="token function">log</span>(<span class="token string">'Signed in:'</span>, user.<span class="token property">email</span>);
            setShowAuth(<span class="token boolean">false</span>);
          }}
          <span class="token property">onClose</span>={() =&gt; setShowAuth(<span class="token boolean">false</span>)}
        <span class="token operator">/&gt;</span>
      )}
    <span class="token operator">&lt;/</span><span class="token property">div</span><span class="token operator">&gt;</span>
  );
}</code></pre>
          </div>
        </div>

        <div class="step">
          <h3 id="next-steps">Next steps</h3>
          <p>You're ready to explore more:</p>
          <div class="cards">
            <a href="#" class="card" data-page="configuration">
              <h4>Configuration</h4>
              <p>Customize OTP length, TTL, and more.</p>
            </a>
            <a href="#" class="card" data-page="adapters">
              <h4>Storage Adapters</h4>
              <p>Switch to Redis or MongoDB for production.</p>
            </a>
            <a href="#" class="card" data-page="2fa">
              <h4>Two-Factor Auth</h4>
              <p>Add TOTP 2FA with backup codes.</p>
            </a>
          </div>
        </div>
      </div>
    `,
  },

  configuration: {
    title: "Configuration",
    toc: [
      "Full Configuration",
      "SMTP Options",
      "JWT Options",
      "OTP Options",
      "Email Template",
      "Using Resend",
    ],
    content: `
      <h1>Configuration</h1>
      <p class="lead">Complete reference for all EasyAuth configuration options.</p>

      <h2 id="full-config">Full Configuration</h2>
      <div class="code-block">
        <span class="filename">config.ts</span>
        <pre><code><span class="token keyword">import</span> { createAuth } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  <span class="token comment">// Required: SMTP configuration</span>
  <span class="token property">smtp</span>: {
    host: <span class="token string">'smtp.example.com'</span>,
    port: <span class="token number">587</span>,
    secure: <span class="token boolean">false</span>, <span class="token comment">// true for port 465</span>
    auth: {
      user: <span class="token string">'username'</span>,
      pass: <span class="token string">'password'</span>,
    },
    <span class="token property">from</span>: <span class="token string">'App Name &lt;noreply@example.com&gt;'</span>,
  },

  <span class="token comment">// Required: JWT configuration</span>
  <span class="token property">jwt</span>: {
    secret: <span class="token string">'your-secret-at-least-32-characters'</span>,
    expiresIn: <span class="token string">'7d'</span>, <span class="token comment">// Default: '7d'</span>
  },

  <span class="token comment">// Optional: Storage adapter (memory by default for dev)</span>
  <span class="token property">store</span>: sqliteAdapter(<span class="token string">'./auth.db'</span>),

  <span class="token comment">// Optional: OTP configuration</span>
  <span class="token property">otp</span>: {
    <span class="token property">length</span>: <span class="token number">6</span>,           <span class="token comment">// Default: 6</span>
    <span class="token property">ttlSeconds</span>: <span class="token number">600</span>,      <span class="token comment">// Default: 600 (10 minutes)</span>
    <span class="token property">maxAttempts</span>: <span class="token number">5</span>,       <span class="token comment">// Default: 5</span>
    <span class="token property">lockoutSeconds</span>: <span class="token number">900</span>, <span class="token comment">// Default: 900 (15 minutes)</span>
  },

  <span class="token comment">// Optional: Email customization</span>
  <span class="token property">email</span>: {
    <span class="token property">subject</span>: <span class="token string">'Your sign-in code'</span>,
    <span class="token property">templateFn</span>: (code) =&gt; ({
      <span class="token property">text</span>: <span class="token string">\`Your code is: \${code}\`</span>,
      <span class="token property">html</span>: <span class="token string">\`&lt;p&gt;Your code is: &lt;strong&gt;\${code}&lt;/strong&gt;&lt;/p&gt;\`</span>,
    }),
  },
});</code></pre>
      </div>

      <h2 id="smtp-options">SMTP Options</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>host</code></td>
            <td>string</td>
            <td>Required</td>
            <td>SMTP server hostname</td>
          </tr>
          <tr>
            <td><code>port</code></td>
            <td>number</td>
            <td>Required</td>
            <td>SMTP port (typically 587 for TLS or 465 for SSL)</td>
          </tr>
          <tr>
            <td><code>secure</code></td>
            <td>boolean</td>
            <td>false</td>
            <td>Use SSL/TLS (true for port 465)</td>
          </tr>
          <tr>
            <td><code>auth.user</code></td>
            <td>string</td>
            <td>Required</td>
            <td>SMTP username</td>
          </tr>
          <tr>
            <td><code>auth.pass</code></td>
            <td>string</td>
            <td>Required</td>
            <td>SMTP password</td>
          </tr>
          <tr>
            <td><code>from</code></td>
            <td>string</td>
            <td>Required</td>
            <td>Sender address (e.g., "App &lt;noreply@example.com&gt;")</td>
          </tr>
        </tbody>
      </table>

      <h2 id="jwt-options">JWT Options</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>secret</code></td>
            <td>string</td>
            <td>Required</td>
            <td>Signing secret (minimum 32 characters)</td>
          </tr>
          <tr>
            <td><code>expiresIn</code></td>
            <td>string</td>
            <td>'7d'</td>
            <td>Token expiration (e.g., '1h', '7d', '30d')</td>
          </tr>
        </tbody>
      </table>

      <h2 id="otp-options">OTP Options</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>length</code></td>
            <td>number</td>
            <td>6</td>
            <td>Number of digits in the OTP</td>
          </tr>
          <tr>
            <td><code>ttlSeconds</code></td>
            <td>number</td>
            <td>600</td>
            <td>Time-to-live for OTPs (seconds)</td>
          </tr>
          <tr>
            <td><code>maxAttempts</code></td>
            <td>number</td>
            <td>5</td>
            <td>Max failed attempts before lockout</td>
          </tr>
          <tr>
            <td><code>lockoutSeconds</code></td>
            <td>number</td>
            <td>900</td>
            <td>Lockout duration after max attempts (seconds)</td>
          </tr>
        </tbody>
      </table>

      <h2 id="email-template">Email Template</h2>
      <p>Customize the email sent to users with <code>templateFn</code>. It receives the OTP code and must return both plain text and HTML versions:</p>
      <pre><code><span class="token property">email</span>: {
  <span class="token property">subject</span>: <span class="token string">'Your EasyAuth verification code'</span>,
  <span class="token property">templateFn</span>: (code) =&gt; ({
    <span class="token property">text</span>: \`
      Hello,
      
      Your verification code is: \${code}
      
      This code expires in 10 minutes.
      If you didn't request this, you can safely ignore this email.
    \`,
    <span class="token property">html</span>: \`
      &lt;h1&gt;Verify your email&lt;/h1&gt;
      &lt;p&gt;Your code is: &lt;strong&gt;\${code}&lt;/strong&gt;&lt;/p&gt;
      &lt;p&gt;This code expires in 10 minutes.&lt;/p&gt;
    \`,
  }),
}</code></pre>

      <h2 id="using-resend">Using Resend</h2>
      <p><a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a> is a modern email API that works great with EasyAuth. Here's how to set it up:</p>
      <pre><code>pnpm add resend</code></pre>
      <div class="code-block">
        <span class="filename">config.ts</span>
        <pre><code><span class="token keyword">import</span> { Resend } <span class="token keyword">from</span> <span class="token string">'resend'</span>;
<span class="token keyword">import</span> { createAuth } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;

<span class="token keyword">const</span> resend = <span class="token keyword">new</span> <span class="token function">Resend</span>(process.<span class="token property">env</span>.<span class="token property">RESEND_API_KEY</span>);

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  <span class="token comment">// Use Resend's SMTP settings</span>
  <span class="token property">smtp</span>: {
    <span class="token property">host</span>: <span class="token string">'smtp.resend.com'</span>,
    <span class="token property">port</span>: <span class="token number">587</span>,
    <span class="token property">secure</span>: <span class="token boolean">false</span>,
    <span class="token property">auth</span>: {
      <span class="token property">user</span>: <span class="token string">'resend'</span>,
      <span class="token property">pass</span>: process.<span class="token property">env</span>.<span class="token property">RESEND_API_KEY</span>,
    },
    <span class="token property">from</span>: <span class="token string">'Your App &lt;onboarding@resend.dev&gt;'</span>,
  },
  <span class="token property">jwt</span>: {
    <span class="token property">secret</span>: process.<span class="token property">env</span>.<span class="token property">JWT_SECRET</span>!,
    <span class="token property">expiresIn</span>: <span class="token string">'7d'</span>,
  },
});</code></pre>
      </div>

      <div class="callout info">
        <strong>Note:</strong> With Resend, you can use any domain you've verified in your Resend dashboard. Make sure to add <code>RESEND_API_KEY</code> to your environment variables.
      </div>
    `,
  },

  "email-otp": {
    title: "Email OTP",
    toc: ["How it works", "sendOTP", "verifyOTP", "Brute Force Protection"],
    content: `
      <h1>Email OTP</h1>
      <p class="lead">Secure one-time passcode authentication via email.</p>

      <h2 id="how-it-works">How it works</h2>
      <p>EasyAuth generates cryptographically secure 6-digit codes using Node.js <code>crypto.randomInt</code>. Each code:</p>
      <ul>
        <li>Is hashed with bcrypt (cost factor 10) before storage — plaintext is never persisted</li>
        <li>Expires after a configurable TTL (default: 10 minutes)</li>
        <li>Is single-use — deleted immediately after successful verification</li>
        <li>Replaces any existing pending OTP for the same email (idempotent resend)</li>
      </ul>

      <h2 id="send-otp">sendOTP</h2>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">sendOTP</span>(email: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Sends an OTP to the specified email address. Creates a new user record if one doesn't exist.</p>
        <p><strong>Parameters:</strong></p>
        <div class="api-params">
          <div class="param-item">
            <span class="param-name">email</span>
            <span class="param-type"> — string</span>
            <p>The recipient email address. Must be a valid email format.</p>
          </div>
        </div>
        <p><strong>Returns:</strong> Resolves when the email has been dispatched.</p>
        <p><strong>Throws:</strong> <code>AuthError</code> with code <code>INVALID_EMAIL</code> if the email format is invalid.</p>
      </div>
      <pre><code><span class="token comment">// Example usage</span>
<span class="token keyword">await</span> auth.<span class="token function">sendOTP</span>(<span class="token string">'user@example.com'</span>);
<span class="token comment">// Email dispatched successfully</span></code></pre>

      <h2 id="verify-otp">verifyOTP</h2>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">verifyOTP</span>(email: <span class="type">string</span>, code: <span class="type">string</span>): <span class="type">Promise&lt;VerifyResult&gt;</span>
        </div>
        <p>Verifies an OTP and issues a JWT session token.</p>
        <p><strong>Parameters:</strong></p>
        <div class="api-params">
          <div class="param-item">
            <span class="param-name">email</span>
            <span class="param-type"> — string</span>
            <p>The email address that received the OTP.</p>
          </div>
          <div class="param-item">
            <span class="param-name">code</span>
            <span class="param-type"> — string</span>
            <p>The 6-digit code entered by the user.</p>
          </div>
        </div>
        <p><strong>Returns:</strong> <code>VerifyResult</code></p>
        <pre><code><span class="token keyword">interface</span> <span class="token type">VerifyResult</span> {
  <span class="token property">token</span>: <span class="token type">string</span>;   <span class="token comment">// JWT session token</span>
  <span class="token property">user</span>: <span class="token type">User</span>;     <span class="token comment">// User object</span>
  <span class="token property">isNewUser</span>: <span class="token type">boolean</span>; <span class="token comment">// True if this is a new account</span>
}

<span class="token keyword">interface</span> <span class="token type">User</span> {
  <span class="token property">email</span>: <span class="token type">string</span>;
  <span class="token property">totpEnabled</span>: <span class="token type">boolean</span>;
  <span class="token property">createdAt</span>: <span class="token type">Date</span>;
}</code></pre>
        <p><strong>Throws:</strong> <code>AuthError</code> with codes: <code>OTP_INVALID</code>, <code>OTP_EXPIRED</code>, <code>OTP_MAX_ATTEMPTS</code>, or <code>ACCOUNT_LOCKED</code>.</p>
      </div>
      <pre><code><span class="token keyword">const</span> result = <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(<span class="token string">'user@example.com'</span>, <span class="token string">'123456'</span>);

console.<span class="token function">log</span>(result.<span class="token property">token</span>);      <span class="token comment">// JWT to store client-side</span>
console.<span class="token function">log</span>(result.<span class="token property">user</span>);     <span class="token comment">// { email, totpEnabled, createdAt }</span>
console.<span class="token function">log</span>(result.<span class="token property">isNewUser</span>); <span class="token comment">// true for new registrations</span></code></pre>

      <h2 id="brute-force-protection">Brute Force Protection</h2>
      <p>EasyAuth implements automatic brute force protection:</p>
      <ul>
        <li>Failed attempts are counted per email address</li>
        <li>After <code>maxAttempts</code> failures (default: 5), the account is locked</li>
        <li>Lockout duration is <code>lockoutSeconds</code> (default: 15 minutes)</li>
        <li>Lockout is checked before OTP comparison — even valid codes are rejected during lockout</li>
      </ul>
      <p>Generic error messages prevent email enumeration attacks.</p>

      <div class="callout info">
        <strong>Note:</strong> For additional protection, consider implementing HTTP-level rate limiting (e.g., <code>express-rate-limit</code>) and CAPTCHA at your API gateway.
      </div>
    `,
  },

  sessions: {
    title: "Sessions & JWT",
    toc: ["verifyToken", "JWT Structure", "Token Revocation"],
    content: `
      <h1>Sessions & JWT</h1>
      <p class="lead">Stateless session management with HS256-signed JSON Web Tokens.</p>

      <h2 id="verify-token">verifyToken</h2>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">verifyToken</span>(token: <span class="type">string</span>): <span class="type">Promise&lt;User&gt;</span>
        </div>
        <p>Verifies a JWT and returns the associated user.</p>
        <p><strong>Parameters:</strong></p>
        <div class="api-params">
          <div class="param-item">
            <span class="param-name">token</span>
            <span class="param-type"> — string</span>
            <p>The JWT to verify (without "Bearer " prefix).</p>
          </div>
        </div>
        <p><strong>Returns:</strong> The <code>User</code> object associated with the token.</p>
        <p><strong>Throws:</strong> <code>AuthError</code> with codes: <code>TOKEN_INVALID</code> or <code>TOKEN_EXPIRED</code>.</p>
      </div>
      <pre><code><span class="token comment">// Example: protecting a route</span>
app.<span class="token function">get</span>(<span class="token string">'/api/protected'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> token = req.<span class="token property">headers</span>.<span class="token property">authorization</span>?.<span class="token function">split</span>(<span class="token string">' '</span>)[<span class="token number">1</span>];
  
  <span class="token keyword">if</span> (!token) {
    <span class="token keyword">return</span> res.<span class="token function">status</span>(<span class="token number">401</span>).<span class="token function">json</span>({ <span class="token property">code</span>: <span class="token string">'TOKEN_INVALID'</span> });
  }
  
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> user = <span class="token keyword">await</span> auth.<span class="token function">verifyToken</span>(token);
    res.<span class="token function">json</span>({ <span class="token property">user</span> });
  } <span class="token keyword">catch</span> (error) {
    res.<span class="token function">status</span>(<span class="token number">401</span>).<span class="token function">json</span>({ <span class="token property">code</span>: error.<span class="token property">code</span> });
  }
});</code></pre>

      <h2 id="jwt-structure">JWT Structure</h2>
      <p>Tokens are HS256 signed and contain the following payload:</p>
      <pre><code>{
  <span class="token property">"sub"</span>: <span class="token string">"user@example.com"</span>,  <span class="token comment">// User's email (subject)</span>
  <span class="token property">"iat"</span>: <span class="token number">1704067200</span>,           <span class="token comment">// Issued at (Unix timestamp)</span>
  <span class="token property">"exp"</span>: <span class="token number">1704672000</span>,           <span class="token comment">// Expiration (7 days by default)</span>
  <span class="token property">"jti"</span>: <span class="token string">"uuid-v4"</span>            <span class="token comment">// Unique token ID for revocation</span>
}</code></pre>

      <h2 id="token-revocation">Token Revocation</h2>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">revokeUser</span>(email: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Revokes all active sessions for a user by purging their OTP state. This effectively invalidates all issued tokens for that user.</p>
        <p><strong>Use cases:</strong></p>
        <ul>
          <li>User requests account deletion</li>
          <li>Security incident response</li>
          <li>Password/2FA reset flow</li>
        </ul>
      </div>
      <pre><code><span class="token comment">// Example: revoke all sessions for a user</span>
<span class="token keyword">await</span> auth.<span class="token function">revokeUser</span>(<span class="token string">'user@example.com'</span>);
<span class="token comment">// All existing tokens for this user are now invalid</span></code></pre>

      <div class="callout">
        <strong>Per-token revocation</strong> is not implemented in v1. The <code>jti</code> claim enables future denylist patterns.
      </div>
    `,
  },

  adapters: {
    title: "Storage Adapters",
    toc: ["SQLite", "Redis", "MongoDB", "Custom Adapters"],
    content: `
      <h1>Storage Adapters</h1>
      <p class="lead">Choose the storage backend that fits your infrastructure.</p>

      <h2 id="sqlite">SQLite</h2>
      <p><strong>Best for:</strong> Development, single-process apps, small-scale deployments.</p>
      <pre><code>pnpm add @easy-auth/adapter-sqlite</code></pre>
      <pre><code><span class="token keyword">import</span> { sqliteAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/adapter-sqlite'</span>;

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  <span class="token comment">// ... other config</span>
  store: <span class="token function">sqliteAdapter</span>(<span class="token string">'./auth.db'</span>),
});</code></pre>
      <p>Uses <code>better-sqlite3</code>. The schema is created on first run and migrated idempotently. WAL mode is enabled by default for better concurrent read performance.</p>

      <h2 id="redis">Redis</h2>
      <p><strong>Best for:</strong> Multi-process / multi-server deployments, edge computing.</p>
      <pre><code>pnpm add @easy-auth/adapter-redis</code></pre>
      <pre><code><span class="token keyword">import</span> { redisAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/adapter-redis'</span>;

<span class="token comment">// Using connection URL</span>
<span class="token keyword">const</span> store = <span class="token function">redisAdapter</span>({ <span class="token property">url</span>: <span class="token string">'redis://localhost:6379'</span> });

<span class="token comment">// Or pass an existing ioredis client</span>
<span class="token keyword">const</span> store = <span class="token function">redisAdapter</span>({ <span class="token property">client</span>: existingRedisClient });

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  <span class="token comment">// ... other config</span>
  store,
});</code></pre>
      <p>Uses <code>ioredis</code>. OTP TTLs are handled with native Redis <code>EXPIRE</code>. All keys are namespaced under <code>easy-auth:*</code>.</p>

      <h2 id="mongodb">MongoDB</h2>
      <p><strong>Best for:</strong> Teams already running MongoDB.</p>
      <pre><code>pnpm add @easy-auth/adapter-mongo</code></pre>
      <pre><code><span class="token keyword">import</span> { mongoAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/adapter-mongo'</span>;

<span class="token keyword">const</span> store = <span class="token function">mongoAdapter</span>({
  <span class="token property">uri</span>: <span class="token string">'mongodb://localhost:27017'</span>,
  <span class="token property">dbName</span>: <span class="token string">'easy-auth'</span>,
});

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  <span class="token comment">// ... other config</span>
  store,
});</code></pre>
      <p>Uses the official <code>mongodb</code> driver (not Mongoose). All indexes are created on first connect, idempotently. OTP TTL is handled via a MongoDB TTL index on <code>expiresAt</code>.</p>

      <h2 id="custom-adapters">Custom Adapters</h2>
      <p>Implement the <code>StorageAdapter</code> interface for any other database:</p>
      <pre><code><span class="token keyword">import</span> type { StorageAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;

<span class="token keyword">class</span> <span class="token class-name">MyCustomAdapter</span> <span class="token keyword">implements</span> <span class="token type">StorageAdapter</span> {
  <span class="token comment">// Implement all required methods</span>
}

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  store: <span class="token keyword">new</span> <span class="token function">MyCustomAdapter</span>(),
});</code></pre>
    `,
  },

  security: {
    title: "Security Model",
    toc: [
      "OTP Security",
      "Brute Force Protection",
      "JWT Security",
      "TOTP Security",
      "Logging Policy",
    ],
    content: `
      <h1>Security Model</h1>
      <p class="lead">How EasyAuth protects your users and your infrastructure.</p>

      <h2 id="otp-security">OTP Security</h2>
      <ul>
        <li>OTPs are generated using <code>crypto.randomInt</code> — a cryptographically secure PRNG. <code>Math.random</code> is never used.</li>
        <li>The plaintext OTP is hashed with bcrypt (cost factor 10) before being stored. The plaintext is never persisted.</li>
        <li>Comparison uses <code>bcrypt.compare</code>, which is timing-safe. String equality is never used.</li>
        <li>OTPs are deleted from the store immediately after a successful verify. They are single-use.</li>
        <li>If a user requests a new OTP while one is pending, the existing OTP is replaced (idempotent resend).</li>
      </ul>

      <h2 id="brute-force-protection">Brute Force Protection</h2>
      <ul>
        <li>Failed OTP attempts are counted per email in the store.</li>
        <li>After <code>maxAttempts</code> failures (default: 5), the account is locked for <code>lockoutSeconds</code> (default: 900 = 15 minutes).</li>
        <li>The lockout is checked before any OTP comparison, so even with a valid code the check is rejected during lockout.</li>
        <li>Error messages are generic and do not reveal whether an email address exists in the store.</li>
      </ul>

      <h2 id="jwt-security">JWT Security</h2>
      <ul>
        <li>Tokens are HS256 signed. The signing secret must be at least 32 characters — enforced at <code>createAuth()</code> time.</li>
        <li>Each token includes a unique <code>jti</code> (JWT ID) UUID, enabling future per-token revocation patterns.</li>
        <li><code>verifyToken</code> throws <code>AuthError</code> on invalid or expired tokens; it never returns <code>null</code>.</li>
      </ul>

      <h2 id="totp-security">TOTP Security</h2>
      <ul>
        <li>TOTP secrets are generated as 20 random bytes encoded as base32 (160-bit entropy).</li>
        <li>Before storage, secrets are encrypted with AES-256-GCM. The encryption key is derived from <code>jwt.secret</code> via HKDF-SHA-256.</li>
        <li>Backup codes are 8 randomly generated alphanumeric characters (64-bit entropy each). They are bcrypt-hashed before storage and are single-use.</li>
        <li>TOTP verification checks the current time window plus one step in each direction (±30s) to handle client clock skew.</li>
        <li>TOTP code comparison uses <code>crypto.timingSafeEqual</code> to prevent timing attacks.</li>
      </ul>

      <h2 id="logging-policy">Logging Policy</h2>
      <p>EasyAuth never logs OTP codes, JWT secrets, or TOTP secrets. The built-in logger is a no-op. If you inject a custom logger, ensure it does not log the <code>req.body</code> of auth endpoints.</p>

      <h2 id="out-of-scope">Out of Scope</h2>
      <table>
        <thead>
          <tr>
            <th>Concern</th>
            <th>Your Responsibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTTP-level rate limiting</td>
            <td>Use express-rate-limit, @fastify/rate-limit, or your CDN</td>
          </tr>
          <tr>
            <td>HTTPS / TLS termination</td>
            <td>Configure your server or reverse proxy</td>
          </tr>
          <tr>
            <td>CAPTCHA / bot detection</td>
            <td>Add Cloudflare Turnstile or hCaptcha at your API gateway</td>
          </tr>
          <tr>
            <td>IP blocking</td>
            <td>Handle at your load balancer or CDN</td>
          </tr>
        </tbody>
      </table>

      <div class="callout">
        <strong>Reporting vulnerabilities:</strong> Open a private security advisory on GitHub. Do not open a public issue for security reports.
      </div>
    `,
  },

  "2fa": {
    title: "Two-Factor Authentication",
    toc: [
      "Overview",
      "Enrollment Flow",
      "Login Flow",
      "Backup Codes",
      "Re-enrollment",
    ],
    content: `
      <h1>Two-Factor Authentication</h1>
      <p class="lead">RFC-6238 compliant TOTP support with authenticator apps.</p>

      <h2 id="overview">Overview</h2>
      <p>EasyAuth supports TOTP (Time-based One-Time Password) 2FA. It works with any TOTP app: Google Authenticator, Authy, 1Password, Bitwarden, etc.</p>
      <p>2FA is optional and configured per-user, not globally.</p>

      <h2 id="enrollment-flow">Enrollment Flow</h2>

      <h3>1. Start enrollment</h3>
      <pre><code><span class="token keyword">const</span> { secret, qrDataUrl, backupCodes } = <span class="token keyword">await</span> auth.<span class="token function">enroll2FA</span>(email);</code></pre>
      <p><code>qrDataUrl</code> is an <code>otpauth://</code> URI. Pass it to a QR code library to render it:</p>
      <pre><code><span class="token keyword">import</span> QRCode <span class="token keyword">from</span> <span class="token string">'qrcode.react'</span>;

<span class="token operator">&lt;</span><span class="token property">QRCode</span> <span class="token property">value</span>={qrDataUrl} <span class="token property">size</span>={<span class="token number">200</span>} <span class="token operator">/&gt;</span></code></pre>
      <p><code>backupCodes</code> is an array of 8 single-use recovery codes. <strong>Show these once and ask the user to save them.</strong> They are not retrievable after this point.</p>

      <h3>2. Confirm enrollment</h3>
      <p>After the user scans the QR code and their authenticator app shows a code:</p>
      <pre><code><span class="token keyword">await</span> auth.<span class="token function">confirm2FA</span>(email, totpCodeFromUser);</code></pre>
      <p>This verifies the code and enables TOTP for that account.</p>

      <h2 id="login-flow">Login Flow (with 2FA)</h2>
      <p>After <code>verifyOTP</code> succeeds, check if the user has 2FA enabled:</p>
      <pre><code><span class="token keyword">const</span> { token, user } = <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(email, otpCode);

<span class="token keyword">if</span> (user.<span class="token property">totpEnabled</span>) {
  <span class="token comment">// Collect TOTP code from authenticator app, then:</span>
  <span class="token keyword">await</span> auth.<span class="token function">verify2FA</span>(email, totpCodeFromUser);
  <span class="token comment">// Now issue the session token to the client</span>
}</code></pre>

      <h2 id="backup-codes">Backup Codes</h2>
      <p>If a user loses their authenticator app, they can use a backup code:</p>
      <pre><code><span class="token comment">// User enters a backup code in the same TOTP field</span>
<span class="token keyword">await</span> auth.<span class="token function">verify2FA</span>(email, backupCode);</code></pre>
      <p>Backup codes work in the same <code>verify2FA</code> call. Each code can only be used once. After use, it is deleted.</p>

      <h2 id="re-enrollment">Re-enrollment</h2>
      <p>To reset 2FA (e.g., user gets a new phone):</p>
      <ol>
        <li>Disable the current TOTP via your adapter: <code>await store.setTOTPEnabled(email, false)</code></li>
        <li>Call <code>auth.enroll2FA(email)</code> again to start fresh</li>
      </ol>

      <h2 id="error-reference">Error Reference</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>2FA_NOT_ENROLLED</code></td>
            <td><code>confirm2FA</code> or <code>verify2FA</code> called before enrollment</td>
          </tr>
          <tr>
            <td><code>2FA_ALREADY_ENROLLED</code></td>
            <td><code>enroll2FA</code> called when TOTP is already enabled</td>
          </tr>
          <tr>
            <td><code>2FA_INVALID</code></td>
            <td>Wrong TOTP code or invalid/used backup code</td>
          </tr>
        </tbody>
      </table>
    `,
  },

  "api-core": {
    title: "Core API",
    toc: [
      "createAuth",
      "AuthInstance",
      "sendOTP",
      "verifyOTP",
      "verifyToken",
      "enroll2FA",
      "confirm2FA",
      "verify2FA",
      "revokeUser",
    ],
    content: `
      <h1>Core API</h1>
      <p class="lead">Complete reference for the EasyAuth core module.</p>

      <h2 id="create-auth">createAuth</h2>
      <div class="api-method">
        <div class="api-signature">
          <span class="token function">createAuth</span>(config: <span class="type">AuthConfig</span>): <span class="type">AuthInstance</span>
        </div>
        <p>Creates and returns an EasyAuth instance. Call this once when your application starts.</p>
      </div>

      <h2 id="auth-instance">AuthInstance</h2>
      <p>The object returned by <code>createAuth</code> with the following methods:</p>

      <h3 id="method-send-otp">sendOTP</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">sendOTP</span>(email: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Sends a one-time passcode to the specified email. Creates a user record if one doesn't exist.</p>
      </div>

      <h3 id="method-verify-otp">verifyOTP</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">verifyOTP</span>(email: <span class="type">string</span>, code: <span class="type">string</span>): <span class="type">Promise&lt;VerifyResult&gt;</span>
        </div>
        <p>Verifies an OTP and returns a JWT session token.</p>
        <pre><code><span class="token keyword">interface</span> <span class="token type">VerifyResult</span> {
  <span class="token property">token</span>: <span class="token type">string</span>;
  <span class="token property">user</span>: <span class="token type">User</span>;
  <span class="token property">isNewUser</span>: <span class="token type">boolean</span>;
}

<span class="token keyword">interface</span> <span class="token type">User</span> {
  <span class="token property">email</span>: <span class="token type">string</span>;
  <span class="token property">totpEnabled</span>: <span class="token type">boolean</span>;
  <span class="token property">createdAt</span>: <span class="token type">Date</span>;
}</code></pre>
      </div>

      <h3 id="method-verify-token">verifyToken</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">verifyToken</span>(token: <span class="type">string</span>): <span class="type">Promise&lt;User&gt;</span>
        </div>
        <p>Verifies a JWT and returns the associated user.</p>
      </div>

      <h3 id="method-enroll-2fa">enroll2FA</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">enroll2FA</span>(email: <span class="type">string</span>): <span class="type">Promise&lt;Enroll2FAResult&gt;</span>
        </div>
        <p>Begins 2FA enrollment for a user.</p>
        <pre><code><span class="token keyword">interface</span> <span class="token type">Enroll2FAResult</span> {
  <span class="token property">secret</span>: <span class="token type">string</span>;       <span class="token comment">// Base32-encoded TOTP secret</span>
  <span class="token property">qrDataUrl</span>: <span class="token type">string</span>;   <span class="token comment">// otpauth:// URI for QR code</span>
  <span class="token property">backupCodes</span>: <span class="token type">string[]</span>; <span class="token comment">// 8 single-use backup codes</span>
}</code></pre>
      </div>

      <h3 id="method-confirm-2fa">confirm2FA</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">confirm2FA</span>(email: <span class="type">string</span>, totpCode: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Confirms 2FA enrollment after the user scans the QR code and enters their first TOTP code.</p>
      </div>

      <h3 id="method-verify-2fa">verify2FA</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">verify2FA</span>(email: <span class="type">string</span>, code: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Verifies a TOTP code or backup code during login. Accepts either a 6-digit TOTP or a single backup code.</p>
      </div>

      <h3 id="method-revoke-user">revokeUser</h3>
      <div class="api-method">
        <div class="api-signature">
          <span class="token keyword">async</span> auth.<span class="token function">revokeUser</span>(email: <span class="type">string</span>): <span class="type">Promise&lt;void&gt;</span>
        </div>
        <p>Revokes all active sessions for a user by purging their OTP state.</p>
      </div>
    `,
  },

  "api-errors": {
    title: "Error Codes",
    toc: ["AuthError", "Error Reference"],
    content: `
      <h1>Error Codes</h1>
      <p class="lead">Complete reference for all EasyAuth error codes.</p>

      <h2 id="auth-error">AuthError</h2>
      <p>All EasyAuth errors are instances of <code>AuthError</code>:</p>
      <pre><code><span class="token keyword">import</span> { AuthError } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;

<span class="token keyword">try</span> {
  <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(email, code);
} <span class="token keyword">catch</span> (error) {
  <span class="token keyword">if</span> (error <span class="token keyword">instanceof</span> <span class="token type">AuthError</span>) {
    console.<span class="token function">log</span>(error.<span class="token property">code</span>);  <span class="token comment">// e.g., 'OTP_INVALID'</span>
    console.<span class="token function">log</span>(error.<span class="token property">status</span>); <span class="token comment">// e.g., 401</span>
    console.<span class="token function">log</span>(error.<span class="token property">message</span>); <span class="token comment">// Human-readable message</span>
  }
}</code></pre>

      <h2 id="error-reference">Error Reference</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>HTTP Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>INVALID_EMAIL</code></td>
            <td>400</td>
            <td>Email format is invalid</td>
          </tr>
          <tr>
            <td><code>OTP_EXPIRED</code></td>
            <td>401</td>
            <td>No valid OTP found or has expired</td>
          </tr>
          <tr>
            <td><code>OTP_INVALID</code></td>
            <td>401</td>
            <td>Wrong code entered</td>
          </tr>
          <tr>
            <td><code>OTP_MAX_ATTEMPTS</code></td>
            <td>429</td>
            <td>Too many wrong attempts</td>
          </tr>
          <tr>
            <td><code>ACCOUNT_LOCKED</code></td>
            <td>429</td>
            <td>Account is in lockout period</td>
          </tr>
          <tr>
            <td><code>TOKEN_INVALID</code></td>
            <td>401</td>
            <td>JWT is malformed or tampered</td>
          </tr>
          <tr>
            <td><code>TOKEN_EXPIRED</code></td>
            <td>401</td>
            <td>JWT has expired</td>
          </tr>
          <tr>
            <td><code>2FA_NOT_ENROLLED</code></td>
            <td>400</td>
            <td>TOTP called but not enrolled</td>
          </tr>
          <tr>
            <td><code>2FA_ALREADY_ENROLLED</code></td>
            <td>400</td>
            <td>2FA already enabled for this user</td>
          </tr>
          <tr>
            <td><code>2FA_INVALID</code></td>
            <td>401</td>
            <td>Wrong TOTP or backup code</td>
          </tr>
        </tbody>
      </table>
    `,
  },

  "example-express": {
    title: "Express + SQLite Example",
    toc: ["Setup", "Complete Server", "Testing"],
    content: `
      <h1>Express + SQLite Example</h1>
      <p class="lead">A complete, production-ready Express API with SQLite storage.</p>

      <h2 id="setup">Setup</h2>
      <p>The fastest way to get started is to clone the example directly:</p>
      <pre><code><span class="token comment"># Clone the example using degit</span>
npx degit altf4-games/EasyAuth/examples/express-sqlite my-auth-api
cd my-auth-api
pnpm install</code></pre>

      <p>Or create a new project from scratch:</p>
      <pre><code><span class="token comment"># Create a new project</span>
mkdir my-auth-api && cd my-auth-api
pnpm init -y

<span class="token comment"># Install dependencies</span>
pnpm add express @easy-auth/core @easy-auth/adapter-sqlite
pnpm add -D typescript @types/express tsx

<span class="token comment"># Install TypeScript (optional)</span>
pnpm add -D @types/express</code></pre>

      <h2 id="complete-server">Complete Server</h2>
      <div class="code-block">
        <span class="filename">src/index.ts</span>
        <pre><code><span class="token keyword">import</span> express <span class="token keyword">from</span> <span class="token string">'express'</span>;
<span class="token keyword">import</span> { createAuth, AuthError } <span class="token keyword">from</span> <span class="token string">'@easy-auth/core'</span>;
<span class="token keyword">import</span> { sqliteAdapter } <span class="token keyword">from</span> <span class="token string">'@easy-auth/adapter-sqlite'</span>;
<span class="token keyword">import</span> dotenv <span class="token keyword">from</span> <span class="token string">'dotenv'</span>;

dotenv.<span class="token function">config</span>();

<span class="token keyword">const</span> app = express();
app.<span class="token function">use</span>(express.<span class="token function">json</span>());

<span class="token keyword">const</span> auth = <span class="token function">createAuth</span>({
  smtp: {
    host: process.<span class="token property">env</span>.<span class="token property">SMTP_HOST</span>!,
    port: <span class="token number">587</span>,
    secure: <span class="token boolean">false</span>,
    auth: {
      user: process.<span class="token property">env</span>.<span class="token property">SMTP_USER</span>!,
      pass: process.<span class="token property">SMTP_PASS</span>!,
    },
    <span class="token property">from</span>: process.<span class="token property">env</span>.<span class="token property">SMTP_FROM</span>!,
  },
  jwt: {
    secret: process.<span class="token property">env</span>.<span class="token property">JWT_SECRET</span>!,
    expiresIn: <span class="token string">'7d'</span>,
  },
  store: <span class="token function">sqliteAdapter</span>(<span class="token string">'./auth.db'</span>),
});

<span class="token comment">// Send OTP</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/send-otp'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> { email } = req.<span class="token property">body</span>;
  <span class="token keyword">try</span> {
    <span class="token keyword">await</span> auth.<span class="token function">sendOTP</span>(email);
    res.<span class="token function">json</span>({ <span class="token property">ok</span>: <span class="token boolean">true</span> });
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">const</span> e = error <span class="token keyword">as</span> <span class="token type">AuthError</span>;
    res.<span class="token function">status</span>(e.<span class="token property">status</span> || <span class="token number">400</span>).<span class="token function">json</span>({ <span class="token property">code</span>: e.<span class="token property">code</span> });
  }
});

<span class="token comment">// Verify OTP</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/verify-otp'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> { email, code } = req.<span class="token property">body</span>;
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> result = <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(email, code);
    res.<span class="token function">json</span>(result);
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">const</span> e = error <span class="token keyword">as</span> <span class="token type">AuthError</span>;
    res.<span class="token function">status</span>(e.<span class="token property">status</span> || <span class="token number">401</span>).<span class="token function">json</span>({ <span class="token property">code</span>: e.<span class="token property">code</span> });
  }
});

<span class="token comment">// Get current user</span>
app.<span class="token function">get</span>(<span class="token string">'/api/auth/me'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> token = req.<span class="token property">headers</span>.<span class="token property">authorization</span>?.<span class="token function">split</span>(<span class="token string">' '</span>)[<span class="token number">1</span>];
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> user = <span class="token keyword">await</span> auth.<span class="token function">verifyToken</span>(token!);
    res.<span class="token function">json</span>({ user });
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">const</span> e = error <span class="token keyword">as</span> <span class="token type">AuthError</span>;
    res.<span class="token function">status</span>(<span class="token number">401</span>).<span class="token function">json</span>({ <span class="token property">code</span>: e.<span class="token property">code</span> });
  }
});

<span class="token comment">// 2FA enrollment</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/enroll-2fa'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> token = req.<span class="token property">headers</span>.<span class="token property">authorization</span>?.<span class="token function">split</span>(<span class="token string">' '</span>)[<span class="token number">1</span>];
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> user = <span class="token keyword">await</span> auth.<span class="token function">verifyToken</span>(token!);
    <span class="token keyword">const</span> result = <span class="token keyword">await</span> auth.<span class="token function">enroll2FA</span>(user.<span class="token property">email</span>);
    res.<span class="token function">json</span>(result);
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">const</span> e = error <span class="token keyword">as</span> <span class="token type">AuthError</span>;
    res.<span class="token function">status</span>(e.<span class="token property">status</span> || <span class="token number">400</span>).<span class="token function">json</span>({ <span class="token property">code</span>: e.<span class="token property">code</span> });
  }
});

<span class="token comment">// 2FA confirmation</span>
app.<span class="token function">post</span>(<span class="token string">'/api/auth/confirm-2fa'</span>, <span class="token keyword">async</span> (req, res) => {
  <span class="token keyword">const</span> { email, code } = req.<span class="token property">body</span>;
  <span class="token keyword">try</span> {
    <span class="token keyword">await</span> auth.<span class="token function">confirm2FA</span>(email, code);
    res.<span class="token function">json</span>({ <span class="token property">ok</span>: <span class="token boolean">true</span> });
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">const</span> e = error <span class="token keyword">as</span> <span class="token type">AuthError</span>;
    res.<span class="token function">status</span>(e.<span class="token property">status</span> || <span class="token number">400</span>).<span class="token function">json</span>({ <span class="token property">code</span>: e.<span class="token property">code</span> });
  }
});

<span class="token keyword">const</span> PORT = process.<span class="token property">env</span>.<span class="token property">PORT</span> || <span class="token number">3000</span>;
app.<span class="token function">listen</span>(PORT, () => console.<span class="token function">log</span>(\`Server running on port \${PORT}\`));</code></pre>
      </div>

      <h2 id="testing">Testing</h2>
      <p>Create a <code>.env</code> file:</p>
      <pre><code><span class="token property">JWT_SECRET</span>=<span class="token string">your-super-secret-key-at-least-32-characters-long</span>
<span class="token property">SMTP_HOST</span>=<span class="token string">smtp.example.com</span>
<span class="token property">SMTP_PORT</span>=<span class="token string">587</span>
<span class="token property">SMTP_USER</span>=<span class="token string">your-smtp-user</span>
<span class="token property">SMTP_PASS</span>=<span class="token string">your-smtp-password</span>
<span class="token property">SMTP_FROM</span>=<span class="token string">My App &lt;noreply@example.com&gt;</span></code></pre>
      <p>Run the server:</p>
      <pre><code>pnpm tsx src/index.ts</code></pre>
    `,
  },

  "example-nextjs": {
    title: "Next.js Example",
    toc: ["Setup", "API Routes", "Auth Modal Component", "Usage"],
    content: `
      <h1>Next.js Example</h1>
      <p class="lead">A full-stack Next.js 14 implementation with the React AuthModal component.</p>

      <h2 id="setup">Setup</h2>
      <pre><code><span class="token comment"># Clone the example</span>
npx degit altf4-games/EasyAuth/examples/nextjs my-next-app
cd my-next-app
pnpm install</code></pre>

      <h2 id="api-routes">API Routes</h2>
      <div class="code-block">
        <span class="filename">app/api/auth/send-otp/route.ts</span>
        <pre><code><span class="token keyword">import</span> { NextRequest, NextResponse } <span class="token keyword">from</span> <span class="token string">'next/server'</span>;
<span class="token keyword">import</span> { auth } <span class="token keyword">from</span> <span class="token string">'@/lib/auth'</span>;

<span class="token keyword">export</span> <span class="token keyword">async</span> <span class="token function">POST</span>(req: NextRequest) {
  <span class="token keyword">const</span> { email } = <span class="token keyword">await</span> req.<span class="token function">json</span>();
  <span class="token keyword">try</span> {
    <span class="token keyword">await</span> auth.<span class="token function">sendOTP</span>(email);
    <span class="token keyword">return</span> NextResponse.<span class="token function">json</span>({ <span class="token property">ok</span>: <span class="token boolean">true</span> });
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">return</span> NextResponse.<span class="token function">json</span>(
      { <span class="token property">code</span>: (error <span class="token keyword">as</span> <span class="token type">Error</span>).<span class="token property">message</span> },
      { <span class="token property">status</span>: <span class="token number">400</span> }
    );
  }
}</code></pre>
      </div>

      <div class="code-block">
        <span class="filename">app/api/auth/verify-otp/route.ts</span>
        <pre><code><span class="token keyword">import</span> { NextRequest, NextResponse } <span class="token keyword">from</span> <span class="token string">'next/server'</span>;
<span class="token keyword">import</span> { auth } <span class="token keyword">from</span> <span class="token string">'@/lib/auth'</span>;

<span class="token keyword">export</span> <span class="token keyword">async</span> <span class="token function">POST</span>(req: NextRequest) {
  <span class="token keyword">const</span> { email, code } = <span class="token keyword">await</span> req.<span class="token function">json</span>();
  <span class="token keyword">try</span> {
    <span class="token keyword">const</span> result = <span class="token keyword">await</span> auth.<span class="token function">verifyOTP</span>(email, code);
    <span class="token keyword">return</span> NextResponse.<span class="token function">json</span>(result);
  } <span class="token keyword">catch</span> (error) {
    <span class="token keyword">return</span> NextResponse.<span class="token function">json</span>(
      { <span class="token property">code</span>: (error <span class="token keyword">as</span> <span class="token type">Error</span>).<span class="token property">message</span> },
      { <span class="token property">status</span>: <span class="token number">401</span> }
    );
  }
}</code></pre>
      </div>

      <h2 id="auth-modal">AuthModal Component</h2>
      <p>The <code>@easy-auth/react</code> package provides a drop-in modal:</p>
      <div class="code-block">
        <span class="filename">components/AuthButton.tsx</span>
        <pre><code><span class="token keyword">'use client'</span>;

<span class="token keyword">import</span> { AuthModal } <span class="token keyword">from</span> <span class="token string">'@easy-auth/react'</span>;
<span class="token keyword">import</span> { useState } <span class="token keyword">from</span> <span class="token string">'react'</span>;

<span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">AuthButton</span>() {
  <span class="token keyword">const</span> [showAuth, setShowAuth] = <span class="token function">useState</span>(<span class="token boolean">false</span>);

  <span class="token keyword">return</span> (
    <span class="token operator">&lt;</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token property">button</span> <span class="token property">onClick</span>={() =&gt; setShowAuth(<span class="token boolean">true</span>)}<span class="token operator">&gt;</span>
        Sign In
      <span class="token operator">&lt;/</span><span class="token property">button</span><span class="token operator">&gt;</span>

      {showAuth &amp;&amp; (
        <span class="token operator">&lt;</span><span class="token property">AuthModal</span>
          <span class="token property">apiBaseUrl</span>={<span class="token string">'/api/auth'</span>}
          <span class="token property">onSuccess</span>={({ token, user }) =&gt; {
            console.<span class="token function">log</span>(<span class="token string">'Authenticated:'</span>, user.<span class="token property">email</span>);
            setShowAuth(<span class="token boolean">false</span>);
          }}
          <span class="token property">onClose</span>={() =&gt; setShowAuth(<span class="token boolean">false</span>)}
        <span class="token operator">/&gt;</span>
      )}
    <span class="token operator">&lt;/</span><span class="token operator">&gt;</span>
  );
}</code></pre>
      </div>

      <h2 id="usage">Usage</h2>
      <p>Add the AuthButton to your layout or pages:</p>
      <div class="code-block">
        <span class="filename">app/layout.tsx</span>
        <pre><code><span class="token keyword">import</span> { AuthButton } <span class="token keyword">from</span> <span class="token string">'@/components/AuthButton'</span>;

<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">function</span> <span class="token function">RootLayout</span>({ children }: { children: React.<span class="token type">ReactNode</span> }) {
  <span class="token keyword">return</span> (
    <span class="token operator">&lt;</span><span class="token property">html</span> <span class="token property">lang</span>=<span class="token string">"en"</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token property">body</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span><span class="token property">header</span><span class="token operator">&gt;</span>
          <span class="token operator">&lt;</span><span class="token property">nav</span><span class="token operator">&gt;</span>
            <span class="token operator">&lt;</span><span class="token property">AuthButton</span> <span class="token operator">/&gt;</span>
          <span class="token operator">&lt;/</span><span class="token property">nav</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;/</span><span class="token property">header</span><span class="token operator">&gt;</span>
        {children}
      <span class="token operator">&lt;/</span><span class="token property">body</span><span class="token operator">&gt;</span>
    <span class="token operator">&lt;/</span><span class="token property">html</span><span class="token operator">&gt;</span>
  );
}</code></pre>
      </div>
    `,
  },

  "example-flutter": {
    title: "Flutter Example",
    toc: ["Setup", "Usage", "API Client"],
    content: `
      <h1>Flutter Example</h1>
      <p class="lead">Cross-platform iOS/Android authentication with native secure storage.</p>

      <h2 id="setup">Setup</h2>
      <pre><code><span class="token comment"># Clone the example</span>
npx degit altf4-games/EasyAuth/examples/flutter-app my-flutter-app
cd my-flutter-app
flutter pub get</code></pre>

      <h2 id="usage">Usage</h2>
      <div class="code-block">
        <span class="filename">lib/main.dart</span>
        <pre><code><span class="token keyword">import</span> <span class="token string">'package:flutter/material.dart'</span>;
<span class="token keyword">import</span> <span class="token string">'package:easy_auth_flutter/easy_auth_flutter.dart'</span>;

<span class="token keyword">void</span> <span class="token function">main</span>() {
  <span class="token function">runApp</span>(<span class="token keyword">const</span> <span class="token function">MyApp</span>());
}

<span class="token keyword">class</span> <span class="token class-name">MyApp</span> <span class="token keyword">extends</span> <span class="token type">StatelessWidget</span> {
  <span class="token keyword">const</span> <span class="token function">MyApp</span>({<span class="token keyword">super</span>.key});

  <span class="token function">build</span>(<span class="token type">BuildContext</span> context) {
    <span class="token keyword">return</span> <span class="token function">MaterialApp</span>(
      <span class="token property">title</span>: <span class="token string">'EasyAuth Demo'</span>,
      <span class="token property">home</span>: <span class="token keyword">const</span> <span class="token function">HomePage</span>(),
    );
  }
}

<span class="token keyword">class</span> <span class="token class-name">HomePage</span> <span class="token keyword">extends</span> <span class="token type">StatelessWidget</span> {
  <span class="token keyword">const</span> <span class="token function">HomePage</span>({<span class="token keyword">super</span>.key});

  <span class="token function">build</span>(<span class="token type">BuildContext</span> context) {
    <span class="token keyword">return</span> <span class="token function">Scaffold</span>(
      <span class="token property">appBar</span>: <span class="token function">AppBar</span>(<span class="token property">title</span>: <span class="token function">const</span> <span class="token function">Text</span>(<span class="token string">'EasyAuth Demo'</span>)),
      <span class="token property">body</span>: <span class="token function">Center</span>(
        <span class="token property">child</span>: <span class="token function">EasyAuthButton</span>(
          <span class="token property">apiBaseUrl</span>: <span class="token string">'https://api.example.com/api/auth'</span>,
          <span class="token property">onSuccess</span>: (token, user) {
            debugPrint(<span class="token string">'Signed in: \${user.email}'</span>);
          },
        ),
      ),
    );
  }
}</code></pre>
      </div>

      <h2 id="api-client">API Client</h2>
      <p>The Flutter SDK requires a backend. See the <a href="#" data-page="example-express">Express + SQLite example</a> for the server implementation.</p>

      <div class="callout">
        <strong>Note:</strong> The Flutter SDK uses platform-native secure storage (Keychain on iOS, Keystore on Android) for persisting session tokens.
      </div>
    `,
  },
};

class DocsApp {
  constructor() {
    this.currentPage = "introduction";
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupSearch();
    this.setupNavigation();
    this.setupMobileMenu();
    this.loadPage("introduction");
  }

  setupTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme") || "light";

    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    themeToggle?.addEventListener("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    });
  }

  setupSearch() {
    const searchInput = document.getElementById("searchInput");

    const searchIndex = [
      {
        page: "introduction",
        keywords: [
          "introduction",
          "overview",
          "features",
          "packages",
          "why easyauth",
        ],
      },
      {
        page: "installation",
        keywords: [
          "install",
          "installation",
          "npm",
          "pnpm",
          "environment variables",
          "setup",
          "requirements",
        ],
      },
      {
        page: "quickstart",
        keywords: [
          "quickstart",
          "quick start",
          "tutorial",
          "getting started",
          "setup backend",
          "api routes",
          "frontend",
        ],
      },
      {
        page: "configuration",
        keywords: [
          "configuration",
          "config",
          "smtp",
          "jwt",
          "otp",
          "email template",
          "resend",
          "options",
        ],
      },
      {
        page: "email-otp",
        keywords: [
          "email otp",
          "one time password",
          "sendotp",
          "verifyotp",
          "brute force",
        ],
      },
      {
        page: "sessions",
        keywords: [
          "sessions",
          "jwt",
          "token",
          "verifytoken",
          "revocation",
          "stateless",
        ],
      },
      {
        page: "adapters",
        keywords: [
          "adapters",
          "storage",
          "sqlite",
          "redis",
          "mongodb",
          "custom adapter",
          "database",
        ],
      },
      {
        page: "security",
        keywords: [
          "security",
          "otp security",
          "jwt security",
          "totp security",
          "brute force protection",
          "logging",
        ],
      },
      {
        page: "2fa",
        keywords: [
          "2fa",
          "two-factor",
          "totp",
          "authenticator",
          "backup codes",
          "enrollment",
          "google authenticator",
        ],
      },
      {
        page: "api-core",
        keywords: [
          "api",
          "core api",
          "createauth",
          "methods",
          "reference",
          "sendotp",
          "verifyotp",
          "verifytoken",
          "enroll2fa",
        ],
      },
      {
        page: "api-errors",
        keywords: ["errors", "error codes", "autherror", "reference", "codes"],
      },
      {
        page: "example-express",
        keywords: ["express", "example", "sqlite", "server", "api"],
      },
      {
        page: "example-nextjs",
        keywords: ["nextjs", "next.js", "example", "react", "authmodal"],
      },
      {
        page: "example-flutter",
        keywords: ["flutter", "mobile", "example", "ios", "android", "dart"],
      },
    ];

    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) return;

        const matches = searchIndex.filter(
          (item) =>
            item.keywords.some((kw) => kw.includes(query)) ||
            item.page.includes(query),
        );

        if (matches.length > 0) {
          this.loadPage(matches[0].page);
          window.scrollTo(0, 0);
          searchInput.value = "";
        }
      }
    });
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll("[data-page]");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page === "github") {
          window.open("https://github.com/altf4-games/EasyAuth", "_blank");
          return;
        }
        if (page) {
          this.loadPage(page);
          window.scrollTo(0, 0);
        }
      });
    });
  }

  setupMobileMenu() {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");

    menuBtn?.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!sidebar?.contains(e.target) && !menuBtn?.contains(e.target)) {
        sidebar?.classList.remove("open");
      }
    });
  }

  loadPage(pageId) {
    const page = pages[pageId];
    if (!page) return;

    this.currentPage = pageId;
    const content = document.getElementById("content");
    const tocList = document.getElementById("tocList");

    if (content) {
      content.innerHTML = page.content;
    }

    this.updateActiveNav(pageId);
    this.updateTOC(page);
  }

  updateActiveNav(pageId) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.page === pageId) {
        link.classList.add("active");
      }
    });
  }

  updateTOC(page) {
    const tocList = document.getElementById("tocList");
    if (!tocList) return;

    tocList.innerHTML = page.toc
      .map(
        (item) =>
          `<li><a href="#${item.toLowerCase().replace(/\s+/g, "-")}">${item}</a></li>`,
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new DocsApp();
});
