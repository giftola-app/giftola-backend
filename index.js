require("dotenv").config();
require("express-async-errors");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

const packageJson = require("./package.json");
const version = packageJson.version;
//extra security
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");
const express = require("express");
const app = express();

//Firebase
const admin = require("firebase-admin");
const credentials = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(credentials),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

const bucket = admin.storage().bucket();

const userAuthMiddleware = require("./middleware/user-authentication");
const adminAuthMiddleware = require("./middleware/admin-authentication");

//* Routes-User
const userAuthRouter = require("./routes/auth");
const contactsRouter = require("./routes/contacts");
const assetsRouter = require("./routes/assets");
const eventsRouter = require("./routes/events");
const interestsRouter = require("./routes/interests");
const questionsRouter = require("./routes/questions");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const groupsRouter = require("./routes/groups");
const savedProductsRouter = require("./routes/saved_products");

//* Routes-Admin
const adminAuthRouter = require("./routes/admin/auth");
const adminCategoriesRouter = require("./routes/admin/categories");
const adminUsersRouter = require("./routes/admin/users");
const adminInterestsRouter = require("./routes/admin/interests");
const adminSettingsRouter = require("./routes/admin/settings");
const adminEventsRouter = require("./routes/admin/events");
const adminGroupsRouter = require("./routes/admin/groups");
const adminQuestionsRouter = require("./routes/admin/questions");

const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 30 * 60 * 1000, // 1 hour window
    max: 500, // start blocking after 500 requests
    message:
      "Too many requests from this IP, please try again after half an hour",
  })
);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get("/", (req, res) => {
  res.send(
    `<!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Century Gothic', sans-serif;
          }
    
          h1 {
            text-align: center;
            margin-top: 25vh;
            /* Adjust as needed to center the text vertically */
            color: #000;
            /* Optional text shadow for readability */
          }
        </style>
      </head>
      <body>
        <h1>Giftola Backend (${version}-${packageJson.config.environment})</h1>
      </body>
    </html>`
  );
});

function attachAdminAndDb(req, res, next) {
  req.admin = admin;
  req.db = db;
  req.bucket = bucket;
  next();
}

app.use(
  /\/api\/v1\/(contacts|users\/auth|assets|events|interests|questions|products|categories|groups|saved-products)/,
  attachAdminAndDb
);
app.use(
  /\/api\/v1\/admin\/(auth|categories|users|settings|groups|events|questions)/,
  attachAdminAndDb
);

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// * Routes - User

app.use("/api/v1/users/auth", userAuthRouter);
app.use("/api/v1/contacts", userAuthMiddleware, contactsRouter);
app.use(
  "/api/v1/assets",
  [upload.single("image"), userAuthMiddleware],
  assetsRouter
);
app.use("/api/v1/events", userAuthMiddleware, eventsRouter);
app.use("/api/v1/interests", userAuthMiddleware, interestsRouter);
app.use("/api/v1/questions", userAuthMiddleware, questionsRouter);
app.use("/api/v1/products", userAuthMiddleware, productsRouter);
app.use("/api/v1/categories", userAuthMiddleware, categoriesRouter);
app.use(
  "/api/v1/groups",
  (req, res, next) => {
    if (req.path.includes("accept-invite")) {
      next();
    } else {
      userAuthMiddleware(req, res, next);
    }
  },
  groupsRouter
);
app.use("/api/v1/saved-products", userAuthMiddleware, savedProductsRouter);

// * Routes - Admin
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/admin/categories", adminAuthMiddleware, adminCategoriesRouter);
app.use("/api/v1/admin/users", adminAuthMiddleware, adminUsersRouter);
app.use("/api/v1/admin/interests", adminAuthMiddleware, adminInterestsRouter);
app.use("/api/v1/admin/settings", adminAuthMiddleware, adminSettingsRouter);
app.use("/api/v1/admin/events", adminAuthMiddleware, adminEventsRouter);
app.use("/api/v1/admin/groups", adminAuthMiddleware, adminGroupsRouter);
app.use("/api/v1/admin/questions", adminAuthMiddleware, adminQuestionsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    app.listen(port, () =>
      console.log(`Server is listening at http://localhost:${port} ...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

// Export the Express API

module.exports = app;
