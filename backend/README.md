# Vastra backend

## Order confirmation email and SMS

The backend saves a cash-on-delivery order first, then sends its confirmation
using Resend (email) and Twilio (SMS). If either provider is not configured or
rejects a message, the order remains saved and checkout reports the delivery
status for each channel.

1. Copy `.env.example` to `.env` (the backend does not load `.env.example`).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. The sender address/domain must
   be verified in Resend.
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.
   The Twilio number must be enabled to send SMS. Checkout currently accepts
   Indian mobile numbers and sends to the `+91` country code.
4. Restart the backend with `npm run dev` or `npm start`.

Keep `.env` private. In production, set these values using the hosting
platform's secret/environment-variable settings rather than committing them.
Email and SMS credentials are used by the backend only; they are never sent to
the browser.

## Admin portal

The storefront admin portal is at `/admin`. Configure these environment
variables in the backend's `.env` file (not `.env.example`) or in the backend
hosting environment before signing in. Restart the backend after changing them:

- `ADMIN_EMAIL`: admin sign-in email.
- `ADMIN_PASSWORD`: a unique password of at least 12 characters.
- `ADMIN_SESSION_SECRET`: a randomly generated secret used to sign expiring
  admin sessions (at least 32 characters). Keep it private and rotate it to
  revoke existing sessions.

The portal manages the storefront catalog, order statuses
(`pending`, `processing`, `shipped`, `delivered`, `cancelled`), and cash-on-delivery
payment records. It can mark a COD amount due or received; it does not process
payments. Product and payment/order data are saved in backend data files (the
product path can be overridden with `PRODUCT_DATA_FILE`). Order updates appear
to customers when they refresh tracking.

Do not expose admin credentials or the session secret in frontend environment
variables or commit them to source control. Use HTTPS in production.

## Order tracking

Customers can look up a saved order with `POST /api/orders/track`, providing its
full order ID and the 10-digit phone number used at checkout. The endpoint
returns the current status, items, total, and placement time without returning
the customer's address or contact details. The storefront remembers placed
orders in that browser and refreshes their status from this endpoint.

Order statuses can be `pending`, `processing`, `shipped`, `delivered`, or
`cancelled`. To enable authorized status updates, set a private
`ORDER_STATUS_ADMIN_TOKEN` environment variable on the backend. Then send
`PATCH /api/orders/{orderId}/status` with `Authorization: Bearer <token>` and a
JSON body such as `{"status":"shipped"}`. Updates are persisted and appear the
next time the customer refreshes their order status. Never expose the token in
frontend code or commit it to source control.
