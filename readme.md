# khadija garments: full-stack mern e-commerce platform

welcome to the repository for khadija garments, a complete e-commerce storefront i built for a mumbai-based wholesale ladies' bottom-wear brand. while most starter storefronts stop at a product grid and a checkout button, i designed khadija garments as a production-grade retail system — covering otp-secured authentication, a full admin control panel, manual upi payment verification, and a dedicated gst wholesale billing flow. this project serves as a showcase of my ability to architect and ship an end-to-end full-stack application: secure auth, role-based access, payment reconciliation, order-lifecycle management, and a polished, fully responsive frontend.

# tech stack

- **frontend framework:** react 19 (vite)
- **styling:** tailwind css v4 with custom transitions and animations
- **routing:** react router v7
- **backend framework:** express 5 (node.js)
- **database:** mongodb atlas (mongoose 9 odm)
- **authentication:** jwt (jsonwebtoken) + bcryptjs, with otp email verification
- **media hosting:** cloudinary (unsigned client-side uploads)
- **email:** nodemailer (gmail) for otp and order notifications
- **security:** helmet, cors allowlist, express-rate-limit, and custom nosql-injection sanitization
- **fonts:** poppins (body) + caveat (accent)
- **hosting:** render (backend web service) + vercel (frontend)

# key features

- **otp-secured accounts:** signup and login are protected by time-limited, rate-limited email otps, with brute-force and email-bombing safeguards baked in.
- **complete admin dashboard:** a role-gated control panel to manage products, categories, orders, and customers, with live revenue reporting.
- **manual upi payments:** customers pay via a generated upi qr / vpa and submit their transaction reference, which the admin verifies against their bank — zero gateway fees.
- **smart cod gating:** cash on delivery unlocks only after a customer's first confirmed online payment, with an active-order cap that protects manual fulfilment.
- **wholesale gst flow:** bulk orders trigger a business-vs-individual step, collecting validated gst billing details for registered businesses.
- **order lifecycle:** live order tracking by code, customer-driven cancellation, and admin soft-delete of delivered orders that preserves monthly revenue integrity.
- **polished, responsive ux:** playful hover-state micro-interactions, custom loaders, dark/light theming, and a mobile-first layout with auto-scroll-to-error validation across the entire site.

# local development setup

follow these steps to run khadija garments on your local machine. you will need node.js installed and a mongodb atlas cluster.

```bash
1. clone the repository
git clone https://github.com/mohammed-owzzz/khadija-garments.git
cd khadija-garments

2. set up the backend
cd server
npm install

create a .env file (see server/.env.example) and add your values:

MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
NODE_ENV=development
JWT_SECRET=your_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_strong_admin_password
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173

start the backend:
npm run dev
the api will be available at http://localhost:5000.

3. set up the frontend
open a second terminal:
cd client
npm install

create a .env file (see client/.env.example) and add your values:

VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=khadija_products
VITE_UPI_VPA=your_upi_id@bank
VITE_UPI_PAYEE=Khadija Garments

start the frontend:
npm run dev
the storefront will be available at http://localhost:5173.
(note: both .env files are included in .gitignore to prevent accidental credential leaks.)
```

# api documentation

the backend exposes a rest api under /api, covering auth, products, categories, orders, and contact. a representative endpoint is shown below.

GET /api/products
returns the full product catalogue, including pricing tiers and colour swatches.

response:

```json
[
  {
    "_id": "6650f1c2a4b9e3f0d8c12345",
    "article": "0101",
    "title": "Rayon Regular Palazzo",
    "category": "Palazzo",
    "fabric": "100% Rayon",
    "fit": "Regular Fit · Elastic Waist",
    "sizes": ["L", "XL", "2XL", "3XL"],
    "wholesalePrice": 115,
    "retailPrice": 155,
    "moq": 6,
    "badge": "NEW"
  }
]
```

other core routes include POST /api/auth/send-register-otp, POST /api/auth/login, POST /api/orders, and GET /api/orders/checkout-status.

# license

this project is licensed under the mit license — see the license file for details.