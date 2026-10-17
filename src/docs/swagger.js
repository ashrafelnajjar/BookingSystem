// src/docs/swagger.js
// OpenAPI 3 specification. The /api-docs page is generated from this file.

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "Booking id (24-character ObjectId)",
  schema: { type: "string", example: "65f1c2a9e4b0a1d2c3e4f567" },
};

const secured = [{ bearerAuth: [] }];

const jsonBody = (schemaRef) => ({
  required: true,
  content: { "application/json": { schema: { $ref: schemaRef } } },
});

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Booking System API",
    version: "1.0.0",
    description:
      "REST API for booking hourly appointments. Customers can pay online through Paymob or pay on site.\n\n" +
      "**Online bookings** are held as `pending` and return a payment link that is valid for 10 minutes. " +
      "If the payment is not completed in time, the slot is released automatically.\n\n" +
      "To try the protected endpoints, log in, copy the returned token, click **Authorize** and paste it.",
  },
  servers: [{ url: process.env.APP_URL || "http://localhost:5000" }],
  tags: [
    { name: "Auth", description: "Authentication and password reset" },
    { name: "Bookings", description: "Booking management" },
    { name: "Payments", description: "Online payments (Paymob)" },
  ],

  paths: {
    // ---------------------------------------------------------------- Auth
    "/api/v1/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        requestBody: jsonBody("#/components/schemas/Signup"),
        responses: {
          201: { description: "Account created" },
          400: errorResponse("Invalid data"),
          409: errorResponse("Email already registered"),
        },
      },
    },

    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        description: "Returns a JWT. Use it with the **Authorize** button.",
        requestBody: jsonBody("#/components/schemas/Login"),
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "success" },
                    token: { type: "string" },
                    user: { type: "object" },
                  },
                },
              },
            },
          },
          401: errorResponse("Wrong email or password"),
        },
      },
    },

    // ------------------------------------------------------------ Bookings
    "/api/v1/bookings/available-slots": {
      get: {
        tags: ["Bookings"],
        summary: "List the free slots for a date",
        parameters: [
          {
            name: "date",
            in: "query",
            required: true,
            description:
              "Date in YYYY-MM-DD format. Must be at least one day after today.",
            schema: { type: "string", example: "2026-10-25" },
          },
        ],
        responses: {
          200: {
            description: "Free slots",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    date: { type: "string", example: "2026-10-25" },
                    results: { type: "integer", example: 8 },
                    availableSlots: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          startTime: { type: "string", example: "09:00" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorResponse("Invalid date, a non-working day, or today/past"),
        },
      },
    },

    "/api/v1/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings",
        description:
          "Regular users see their own bookings. Admins see all bookings.",
        security: secured,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "finished"],
            },
          },
          {
            name: "date",
            in: "query",
            description: "YYYY-MM-DD",
            schema: { type: "string", example: "2026-10-25" },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of bookings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    results: { type: "integer", example: 3 },
                    total: { type: "integer", example: 12 },
                    page: { type: "integer", example: 1 },
                    pages: { type: "integer", example: 2 },
                    data: {
                      type: "object",
                      properties: {
                        bookings: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Booking" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse("Not logged in"),
        },
      },

      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        description:
          "`on_site`: the booking is confirmed immediately. " +
          "`online`: the booking is `pending` and a payment link valid for 10 minutes is returned.",
        security: secured,
        requestBody: jsonBody("#/components/schemas/CreateBooking"),
        responses: {
          201: {
            description: "Booking created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        booking: { $ref: "#/components/schemas/Booking" },
                        paymentUrl: {
                          type: "string",
                          description: "Online bookings only",
                        },
                        expiresAt: {
                          type: "string",
                          format: "date-time",
                          description: "Online bookings only",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorResponse("Invalid data or outside working hours"),
          401: errorResponse("Not logged in"),
          409: errorResponse("This appointment is already booked"),
          502: errorResponse("Could not create the payment link"),
        },
      },
    },

    "/api/v1/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Get a single booking",
        security: secured,
        parameters: [idParam],
        responses: {
          200: {
            description: "The booking",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        booking: { $ref: "#/components/schemas/Booking" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: errorResponse("Not logged in"),
          403: errorResponse("This booking belongs to another user"),
          404: errorResponse("Booking not found"),
        },
      },

      patch: {
        tags: ["Bookings"],
        summary: "Update a booking",
        description:
          "Name, phone, description, date and start time can be changed. " +
          "Cancelled or finished bookings cannot be updated.",
        security: secured,
        parameters: [idParam],
        requestBody: jsonBody("#/components/schemas/UpdateBooking"),
        responses: {
          200: { description: "Booking updated" },
          400: errorResponse(
            "Invalid data, or the booking is cancelled/finished",
          ),
          401: errorResponse("Not logged in"),
          403: errorResponse("This booking belongs to another user"),
          404: errorResponse("Booking not found"),
          409: errorResponse("The new appointment is already booked"),
        },
      },
    },

    "/api/v1/bookings/{id}/cancel": {
      patch: {
        tags: ["Bookings"],
        summary: "Cancel a booking",
        description: "A paid booking cannot be cancelled.",
        security: secured,
        parameters: [idParam],
        responses: {
          200: { description: "Booking cancelled" },
          400: errorResponse("Already cancelled, finished, or paid"),
          401: errorResponse("Not logged in"),
          403: errorResponse("This booking belongs to another user"),
          404: errorResponse("Booking not found"),
        },
      },
    },

    // ------------------------------------------------------------ Payments
    "/api/v1/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Paymob webhook (not for manual use)",
        description:
          "Called by Paymob after a payment attempt. The request must carry a valid `hmac` " +
          "query parameter, otherwise it is rejected with 401.",
        parameters: [
          {
            name: "hmac",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Received" },
          401: errorResponse("Invalid HMAC signature"),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          message: {
            type: "string",
            example: "this appointment is already booked",
          },
        },
      },
      Signup: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Ahmed Ali" },
          email: { type: "string", example: "ahmed@example.com" },
          password: { type: "string", example: "StrongPass123" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "ahmed@example.com" },
          password: { type: "string", example: "StrongPass123" },
        },
      },

      Booking: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1c2a9e4b0a1d2c3e4f567" },
          user: { type: "string" },
          name: { type: "string", example: "Ahmed Ali" },
          phone: { type: "string", example: "01012345678" },
          description: { type: "string", example: "First visit" },
          date: { type: "string", example: "2026-10-25" },
          startTime: { type: "string", example: "10:00" },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled", "finished"],
          },
          paymentMethod: { type: "string", enum: ["online", "on_site"] },
          paymentStatus: { type: "string", enum: ["unpaid", "paid"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateBooking: {
        type: "object",
        required: ["name", "phone", "date", "startTime", "paymentMethod"],
        properties: {
          name: { type: "string", example: "Ahmed Ali" },
          phone: { type: "string", example: "01012345678" },
          description: {
            type: "string",
            maxLength: 300,
            example: "First visit",
          },
          date: { type: "string", example: "2026-10-25" },
          startTime: { type: "string", example: "10:00" },
          paymentMethod: { type: "string", enum: ["online", "on_site"] },
        },
      },
      UpdateBooking: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          description: { type: "string", maxLength: 300 },
          date: { type: "string", example: "2026-10-26" },
          startTime: { type: "string", example: "11:00" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
