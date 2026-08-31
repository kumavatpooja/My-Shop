# My Shop — MERN stack

A small storefront with an admin panel and UPI checkout, built on MongoDB, Express, React, and Node.

- **Public storefront** — browse products by category (Bags / Jewelry / Clothes / Other), search by name, swipe through multiple product photos or watch a product video, tap "Buy now" to place an order and get a UPI QR code + payment link. No customer account or login required — just name, phone, and delivery address.
- **Admin panel** — passcode-protected. Add/edit/delete products — up to 6 photos each (upload several at once or paste links) plus an optional video (upload a file or paste a URL/YouTube/Vimeo link), and a category. View every order placed with buyer contact details, and update each order's status (Pending / Paid / Shipped / Cancelled). Also set your store name, UPI ID, and passcode.
- **Real backend** — products, orders, and settings live in MongoDB; uploaded videos are stored on the server's disk and served back over HTTP.

Payments: this generates a standard `upi://pay` link and a matching QR code — it opens the buyer's UPI app (Google Pay, PhonePe, Paytm, etc.) with the amount pre-filled. It does **not** verify that payment was received — there's no payment gateway wired in, so always check your bank/UPI app before shipping an order.

## Project structure

```
mern-shop/
  server/     Express API + MongoDB models
  client/     React app (Vite)
```

## 1. Requirements

- Node.js 18+
- A MongoDB database — either installed locally, or a free cluster on MongoDB Atlas (atlas.mongodb.com)

## 2. Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string (used to sign admin login sessions)
- `CLIENT_ORIGIN` — where your React app runs (default `http://localhost:5173`)

Start it:

```bash
npm run dev
```

The API runs on `http://localhost:5000`. The admin passcode defaults to **1234** — change it from the admin panel after your first login.

## 3. Set up the client

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Shop tab is public; the Admin tab asks for the passcode.

## 4. Deploying for real

- **Server**: deploy to something like Render, Railway, or a VPS. Set the same environment variables there, pointing `MONGO_URI` at your production database (MongoDB Atlas is the easiest managed option). If you use uploaded product videos, note that most free hosting tiers wipe local disk storage on redeploy — for a production site, swap the upload route to a cloud storage bucket (e.g. Cloudinary, S3) instead of local disk. For a small shop, pasting a YouTube/Vimeo link avoids this entirely.
- **Client**: run `npm run build` inside `client/`, which outputs static files to `client/dist/`. Deploy that to Netlify, Vercel, or any static host. Point `VITE_API_URL` (set at build time) at your deployed server's URL.
- Use a real UPI ID you control in the admin panel's Store settings once it's live.

## Notes

- Uploaded product photos are resized in the browser before saving, to keep the database small. For many products, image URLs (photos hosted elsewhere) load faster than uploads.
- The admin passcode is stored hashed in the database, never in plain text.
- This is a starting point, not a payment-processing system — for automatic payment verification you'd need to integrate a payment gateway (e.g. Razorpay or Cashfree) that supports UPI and can confirm transactions via webhook.
