// ============================================================
// Demo Scenario — Code Change: Payment Retry Logic
// Realistic TypeScript payment service code.
// ============================================================

import type { DemoScenario } from "./types";

export const paymentRetryScenario: DemoScenario = {
  id: "payment-retry",
  changeType: "code",
  title: "Payment Retry Logic",
  description: "A payment service change that increases retry attempts after transient failures.",
  previewBullets: [
    "Retry behavior and attempt limits",
    "Idempotency key handling across retries",
    "Duplicate charge exposure",
    "Exponential backoff configuration",
    "Error classification: transient vs. terminal",
  ],
  inputTitle: "Increase Payment Retry Attempts from 3 to 5",
  language: "TypeScript",
  projectContext: "payment-service",
  fileContext: "src/payments/retry.ts, src/payments/processor.ts",
  additionalContext:
    "We are increasing retry attempts to reduce false-negative payment failures from transient network errors. The payment provider (Stripe) has been returning 503s during peak load. Finance has flagged that some legitimate transactions are failing unnecessarily.",
  content: `import Stripe from "stripe";
import { db } from "../db";
import { logger } from "../logger";
import { PaymentRecord, PaymentStatus } from "../types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Previously MAX_RETRIES = 3. Increasing to 5 to reduce
// false-negative failures from transient provider errors.
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 500;

const RETRYABLE_CODES = new Set([
  "lock_timeout",
  "rate_limit",
  "api_connection_error",
  "service_unavailable",
]);

export async function processPaymentWithRetry(
  paymentIntentId: string,
  customerId: string,
  amountCents: number,
  idempotencyKey: string
): Promise<PaymentRecord> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info({ paymentIntentId, attempt }, "Processing payment attempt");

      // Confirm the PaymentIntent — idempotency key scoped to attempt
      const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: await getDefaultPaymentMethod(customerId),
      }, {
        idempotencyKey: \`\${idempotencyKey}-attempt-\${attempt}\`,
      });

      if (confirmed.status === "succeeded") {
        const record = await db.payments.upsert({
          where: { intentId: paymentIntentId },
          update: { status: PaymentStatus.SUCCEEDED, confirmedAt: new Date() },
          create: {
            intentId: paymentIntentId,
            customerId,
            amountCents,
            status: PaymentStatus.SUCCEEDED,
            idempotencyKey,
            confirmedAt: new Date(),
          },
        });
        logger.info({ paymentIntentId, attempt }, "Payment succeeded");
        return record;
      }

      // requires_action, processing — not an error, caller should poll
      if (confirmed.status === "requires_action" || confirmed.status === "processing") {
        return await db.payments.upsert({
          where: { intentId: paymentIntentId },
          update: { status: PaymentStatus.PENDING },
          create: {
            intentId: paymentIntentId,
            customerId,
            amountCents,
            status: PaymentStatus.PENDING,
            idempotencyKey,
          },
        });
      }

      // payment_failed — terminal, do not retry
      throw new Error(\`Payment terminal failure: \${confirmed.status}\`);

    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const stripeCode = (err as { code?: string }).code;
      const isRetryable = stripeCode ? RETRYABLE_CODES.has(stripeCode) : false;

      if (!isRetryable) {
        logger.error({ paymentIntentId, attempt, code: stripeCode }, "Non-retryable payment error");
        await db.payments.upsert({
          where: { intentId: paymentIntentId },
          update: { status: PaymentStatus.FAILED, failureReason: lastError.message },
          create: {
            intentId: paymentIntentId,
            customerId,
            amountCents,
            status: PaymentStatus.FAILED,
            idempotencyKey,
            failureReason: lastError.message,
          },
        });
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        logger.warn({ paymentIntentId, attempt, backoffMs }, "Retryable error, backing off");
        await sleep(backoffMs);
      }
    }
  }

  // All retries exhausted
  logger.error({ paymentIntentId }, "Payment failed after max retries");
  await db.payments.upsert({
    where: { intentId: paymentIntentId },
    update: { status: PaymentStatus.FAILED, failureReason: lastError?.message },
    create: {
      intentId: paymentIntentId,
      customerId,
      amountCents,
      status: PaymentStatus.FAILED,
      idempotencyKey,
      failureReason: lastError?.message ?? "Max retries exceeded",
    },
  });

  throw lastError ?? new Error("Payment failed after max retries");
}

async function getDefaultPaymentMethod(customerId: string): Promise<string> {
  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 1,
  });
  if (!methods.data.length) throw new Error(\`No payment methods for customer \${customerId}\`);
  return methods.data[0].id;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
`,
};
