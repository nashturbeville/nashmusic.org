# NashMusic.org

Nash Turbeville's performance, song request, tipping, booking, and calendar website. Built with Astro and hosted on Cloudflare Pages from this GitHub repository.

## Add your content

Open `/studio` on the website. Fill in your details and download the updated `content.json`. In GitHub, replace `public/content.json` with that downloaded file and commit the change. Cloudflare publishes the update automatically. The editor does not publish by itself. Its fields contain public information only; never enter account passwords or secret keys.

You can also send your repertoire, dates, and performance links to your coding assistant to add for you. The website starts with honest empty states, without sample performances or invented repertoire.

Song example for the Songs field (replace with songs you actually perform):
```json
[{"title":"Your song title","artist":"Original artist","genre":"Pop","decade":"1990s"}]
```

Video example:
```json
[{"title":"Solo piano performance","url":"https://www.youtube.com/watch?v=YOUR_VIDEO_ID","type":"Solo piano","thumbnail":""}]
```

Calendar example (replace with your real show):
```json
[{"title":"Show or contract name","start":"2027-01-15","end":"2027-01-20","venue":"Venue or ship","location":"City or itinerary","type":"Cruise contract","time":"Evenings","timezone":"Venue local time","url":"","notes":"Public attendance information"}]
```
End dates are inclusive. Omit `end` for a single show. Only include public schedule details. Calendar downloads use all-day entries; show times appear as descriptive text. They are a snapshot, not an automatically updating subscription.

## What Nash needs to provide

- Public Venmo and Cash App payment links.
- Booking email and teaching email (they can be the same).
- A phone number you are comfortable making public for audience requests, including country code.
- A Stripe Payment Link for the simplest Apple Pay/card option, or a connected Stripe account for integrated checkout.
- Repertoire, performance links, photos, public show dates, teaching background, and optional EPK PDF.

The contact form prepares an email in the visitor's email app; they must press Send. It is not a server-delivered email form. Your mailbox must already exist. Teaching is a subsection of Booking & EPK and Contact Me; the old Harmonic Home address redirects there.

## External QR codes

`deliverables/performance-requests-qr.png` and `.svg` link directly to `https://nashmusic.org/requests`.
`deliverables/homepage-qr.png` and `.svg` link to `https://nashmusic.org/`.

These files are for signs, cards, or print. They are intentionally outside the public website folder. Test both with a phone after the custom domain is active, before printing.

## Payments and messages

Venmo and Cash App open your supplied payment links. Visitors copy their request note and paste it into the payment memo, then return to select **Text my request**. These payments are not automatically verified by this website.

A Stripe Payment Link can work without server setup. For integrated checkout, add the encrypted `STRIPE_SECRET_KEY` in Cloudflare Pages project settings, then redeploy. Apple Pay is offered by Stripe when eligible for the visitor's device, wallet, and account; cards are also available. Never place a Stripe secret in `content.json` or GitHub.

The texting button opens the visitor's messaging app with the request prepared. The visitor must send it. Delivery may be iMessage or SMS depending on their device and service; the site cannot automatically send personal iMessages.

## Optional request desk and SMS notifications

Create a Cloudflare Workers KV namespace and bind it to the Pages project as `REQUESTS`. Add an encrypted, strong `ADMIN_KEY` in Pages environment settings. Redeploy. Open `/studio`, enter the admin key, and load the request desk. Requests expire after 30 days. KV rate limiting and duplicate suppression are best effort, not transactional guarantees.

For verified Stripe payment labels, add a Stripe webhook endpoint at `https://nashmusic.org/api/stripe-webhook`, listening for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Save its signing secret as encrypted `STRIPE_WEBHOOK_SECRET` in Cloudflare, then redeploy. Configure KV before enabling the webhook. Test with Stripe test-mode credentials and events before using live keys. A success redirect alone never marks a request paid.

Optional automated SMS alerts require your own activated Twilio service and any required messaging registration. Add encrypted environment variables `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, and `NOTIFY_PHONE`. Message fees may apply. These alerts are SMS, not automated iMessage. Leave them unset to disable alerts. Do not send secrets in chat.

## Development and deployment

Install with `pnpm install`, run `pnpm dev`, test with `node --test tests/api.test.js`, and build with `pnpm build`. Cloudflare Pages uses build command `pnpm build`, output directory `dist`, and production branch `main`. The root `functions/` directory contains Pages Functions. Astro preview serves the static site only; API checks require the Cloudflare environment.

Connect `nashmusic.org` in the Pages project's Custom domains panel. Preserve existing email-related DNS records. Keep a previous deployment available in Cloudflare for rollback.
