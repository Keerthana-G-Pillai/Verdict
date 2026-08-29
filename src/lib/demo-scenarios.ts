// ============================================================
// VERDICT Demo Scenarios — Hackathon preset data
// These populate real input forms and run through real pipelines.
// ============================================================

import type { ChangeType } from "@/lib/analysis/types";

export interface DemoAnalysisScenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  expectedVerdict: string;
  expectedVerdictColor: string;
  input: {
    title: string;
    changeType: ChangeType;
    language?: string;
    content: string;
    description?: string;
  };
}

export interface DemoSimulationScenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  expectedVerdict: string;
  expectedVerdictColor: string;
  signatureDemo?: boolean;
  changeA: { title: string; changeType: ChangeType; content: string };
  changeB: { title: string; changeType: ChangeType; content: string };
}

export const DEMO_ANALYSIS_SCENARIOS: DemoAnalysisScenario[] = [
  {
    id: "payment-retry",
    label: "Payment Retry Risk",
    description: "Increase retry attempts without idempotency",
    icon: "payments",
    expectedVerdict: "REQUIRES REVISION",
    expectedVerdictColor: "#ffb4ab",
    input: {
      title: "Increase payment retry attempts from 3 to 5",
      changeType: "code",
      language: "TypeScript",
      content: `async function processPayment(amount: number, customerId: string): Promise<PaymentResult> {
  const MAX_RETRIES = 5; // Previously 3
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      const result = await stripeClient.charges.create({
        amount,
        currency: 'usd',
        customer: customerId,
      });
      return { success: true, chargeId: result.id };
    } catch (error) {
      attempt++;
      if (attempt === MAX_RETRIES) throw error;
      await sleep(1000 * attempt); // backoff
    }
  }
}`,
      description: "We've been seeing intermittent payment failures due to network timeouts. Increasing retries from 3 to 5 should improve success rates.",
    },
  },
  {
    id: "auth-migration",
    label: "Authentication Migration",
    description: "Migrate from JWT to session-based auth",
    icon: "lock",
    expectedVerdict: "REQUIRES REVISION",
    expectedVerdictColor: "#ffb4ab",
    input: {
      title: "Migrate authentication from JWT to server-side sessions",
      changeType: "decision",
      content: `Should we migrate our authentication system from JWT (JSON Web Tokens) to server-side session-based authentication?

Current state:
- We use JWTs with 24-hour expiry
- Token refresh happens client-side every 23 hours
- JWTs are stored in localStorage
- All API routes validate JWT signature

Proposed change:
- Replace JWT with server-side sessions stored in Redis
- Session cookies with httpOnly flag (CSRF protection)
- Session expiry managed server-side
- Revocation is instant (can invalidate any session)

Motivation: Recent security audit flagged localStorage JWT storage as a risk. Session-based auth gives us instant revocation capability.`,
      description: "Security team recommendation following Q4 audit.",
    },
  },
  {
    id: "db-migration",
    label: "Database Column Rename",
    description: "Rename a critical database column",
    icon: "database",
    expectedVerdict: "REQUIRES REVISION",
    expectedVerdictColor: "#ffb4ab",
    input: {
      title: "Rename user_email to email in users table",
      changeType: "diff",
      content: `--- a/migrations/20240115_rename_email_column.sql
+++ b/migrations/20240115_rename_email_column.sql
@@ -0,0 +1,8 @@
+-- Migration: Rename user_email to email for consistency
+BEGIN;
+
+ALTER TABLE users RENAME COLUMN user_email TO email;
+
+-- Update index
+DROP INDEX IF EXISTS idx_user_email;
+CREATE INDEX idx_email ON users(email);
+
+COMMIT;`,
      description: "Column naming standardization across the database. All instances of user_email should become email.",
    },
  },
  {
    id: "api-field",
    label: "API Response Field Rename",
    description: "Rename token field in auth API response",
    icon: "api",
    expectedVerdict: "APPROVED WITH CONDITIONS",
    expectedVerdictColor: "#ffb95f",
    input: {
      title: "Rename auth response field from token to accessToken",
      changeType: "code",
      language: "TypeScript",
      content: `// AuthController.ts
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await UserService.authenticate(email, password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const accessToken = await generateJWT(user); // previously: token
  const refreshToken = await generateRefreshToken(user);
  
  return res.json({
    accessToken,  // previously: token
    refreshToken,
    expiresIn: 3600,
    user: { id: user.id, email: user.email }
  });
}`,
      description: "Standardizing with OAuth naming convention. The response field 'token' is being renamed to 'accessToken'.",
    },
  },
];

export const DEMO_SIMULATION_SCENARIOS: DemoSimulationScenario[] = [
  {
    id: "auth-conflict",
    label: "Authentication Migration Conflict",
    description: "The signature VERDICT demo — semantic conflict Git cannot detect",
    icon: "psychology_alt",
    expectedVerdict: "CONFLICT DETECTED",
    expectedVerdictColor: "#ffb4ab",
    signatureDemo: true,
    changeA: {
      title: "Migrate JWT authentication to server-side sessions",
      changeType: "decision",
      content: `We are migrating authentication from JWT tokens to server-side session-based authentication.

Changes:
- Remove JWT token generation and validation
- Implement server-side session store using Redis
- Replace Authorization: Bearer <jwt> header pattern with session cookies
- Sessions expire server-side after 8 hours of inactivity
- Instant session revocation capability added
- All existing JWT tokens will be invalidated on deployment

This is a breaking change to the authentication mechanism.`,
    },
    changeB: {
      title: "Extend JWT refresh token lifetime and add silent refresh",
      changeType: "code",
      content: `// JWT Refresh Service
const JWT_REFRESH_EXPIRY = '30d'; // Extended from 7d
const JWT_ACCESS_EXPIRY = '1h';   // Extended from 15m

async function silentRefresh(refreshToken: string): Promise<TokenPair> {
  const payload = await verifyJWT(refreshToken, JWT_REFRESH_SECRET);
  
  // Issue new access token using refresh token
  const newAccessToken = await signJWT(
    { userId: payload.userId, roles: payload.roles },
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
  
  // Rotate refresh token for security
  const newRefreshToken = await signJWT(
    { userId: payload.userId },
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
  
  await invalidateOldRefreshToken(refreshToken);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}`,
    },
  },
  {
    id: "payment-conflict",
    label: "Payment Retry + Transaction Processing",
    description: "Retry increase meets unprotected transaction processor",
    icon: "payments",
    expectedVerdict: "CONFLICT DETECTED",
    expectedVerdictColor: "#ffb4ab",
    changeA: {
      title: "Increase payment retry attempts from 3 to 5",
      changeType: "code",
      content: `async function processPaymentWithRetry(payment: PaymentRequest): Promise<PaymentResult> {
  const MAX_RETRIES = 5; // Increased from 3
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await stripeClient.charges.create({
        amount: payment.amount,
        currency: payment.currency,
        customer: payment.customerId,
        description: payment.description,
      });
      return { success: true, chargeId: result.id };
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await delay(Math.pow(2, attempt) * 500);
    }
  }
}`,
    },
    changeB: {
      title: "Refactor transaction processing to handle webhook events",
      changeType: "code",
      content: `async function processTransaction(transactionData: TransactionData): Promise<void> {
  // New implementation processes transaction without idempotency key
  const transaction = await db.transactions.create({
    amount: transactionData.amount,
    customerId: transactionData.customerId,
    status: 'processing',
  });
  
  await paymentGateway.execute({
    amount: transaction.amount,
    reference: transaction.id,
  });
  
  await db.transactions.update(transaction.id, { status: 'completed' });
  await notificationService.sendReceipt(transaction);
}`,
    },
  },
  {
    id: "safe-merge",
    label: "Safe Merge — Unrelated Changes",
    description: "Two genuinely independent changes — no conflicts",
    icon: "check_circle",
    expectedVerdict: "SAFE TO INTEGRATE",
    expectedVerdictColor: "#6ffbbe",
    changeA: {
      title: "Update error logging format to structured JSON",
      changeType: "code",
      content: `// Logger service update — structured JSON logging
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Usage: logger.info('User action', { userId, action, timestamp })
// Replaces: console.log(\`User \${userId} performed \${action}\`)`,
    },
    changeB: {
      title: "Update marketing landing page hero section styles",
      changeType: "code",
      content: `/* Hero Section — Updated Typography and Spacing */
.hero-section {
  background: linear-gradient(135deg, #0a0a0b 0%, #141416 100%);
  min-height: 100vh;
  padding: 120px 32px 80px;
}

.hero-headline {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #e5e2e3;
  max-width: 900px;
}

.hero-cta-primary {
  background: #00f0ff;
  color: #00363a;
  padding: 12px 32px;
  border-radius: 4px;
  font-weight: 600;
}`,
    },
  },
];
