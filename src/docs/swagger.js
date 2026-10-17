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
  description: "رقم الحجز (24 حرف)",
  schema: { type: "string", example: "65f1c2a9e4b0a1d2c3e4f567" },
};
 
const secured = [{ bearerAuth: [] }];
 
const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Booking System API",
    version: "1.0.0",
    description:
      "API لحجز المواعيد: حجز بمواعيد بالساعة، دفع أونلاين عن طريق Paymob أو الدفع في المكان.\n\n" +
      "لتجربة الـ endpoints المقفولة اضغط **Authorize** وحط الـ token اللي رجع من تسجيل الدخول.",
  },
  servers: [{ url: process.env.APP_URL || "http://localhost:5000" }],
  tags: [
    { name: "Bookings", description: "إدارة الحجوزات" },
    { name: "Payments", description: "الدفع (Paymob)" },
  ],
 
  paths: {
    "/api/v1/bookings/available-slots": {
      get: {
        tags: ["Bookings"],
        summary: "المواعيد المتاحة في يوم معين",
        parameters: [
          {
            name: "date",
            in: "query",
            required: true,
            description: "التاريخ بصيغة YYYY-MM-DD (لازم يوم بعد النهارده على الأقل)",
            schema: { type: "string", example: "2026-10-25" },
          },
        ],
        responses: {
          200: {
            description: "قايمة المواعيد الفاضية",
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
          400: errorResponse("تاريخ غلط، أو يوم إجازة، أو النهارده/فات"),
        },
      },
    },
 
    "/api/v1/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "عرض الحجوزات",
        description:
          "المستخدم العادي بيشوف حجوزاته بس، والأدمن بيشوف كل الحجوزات.",
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
            description: "قايمة الحجوزات",
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
          401: errorResponse("مش مسجّل دخول"),
        },
      },
 
      post: {
        tags: ["Bookings"],
        summary: "إنشاء حجز جديد",
        description:
          "`on_site`: الحجز بيتأكد على طول. `online`: الحجز بيبقى pending ويرجّع لينك دفع صالح 10 دقايق.",
        security: secured,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBooking" },
            },
          },
        },
        responses: {
          201: {
            description: "اتعمل الحجز",
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
                          description: "للحجز الأونلاين بس",
                        },
                        expiresAt: {
                          type: "string",
                          format: "date-time",
                          description: "للحجز الأونلاين بس",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorResponse("بيانات غلط أو خارج مواعيد العمل"),
          401: errorResponse("مش مسجّل دخول"),
          409: errorResponse("الميعاد محجوز بالفعل"),
          502: errorResponse("فشل إنشاء لينك الدفع"),
        },
      },
    },
 
    "/api/v1/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "عرض حجز واحد",
        security: secured,
        parameters: [idParam],
        responses: {
          200: {
            description: "الحجز",
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
          401: errorResponse("مش مسجّل دخول"),
          403: errorResponse("الحجز مش بتاعك"),
          404: errorResponse("مفيش حجز بالرقم ده"),
        },
      },
 
      patch: {
        tags: ["Bookings"],
        summary: "تعديل حجز",
        description:
          "بيتعدل الاسم والتليفون والوصف والتاريخ والساعة. الحجز الملغي أو المنتهي مينفعش يتعدل.",
        security: secured,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateBooking" },
            },
          },
        },
        responses: {
          200: { description: "اتعدل الحجز" },
          400: errorResponse("بيانات غلط أو الحجز ملغي/منتهي"),
          401: errorResponse("مش مسجّل دخول"),
          403: errorResponse("الحجز مش بتاعك"),
          404: errorResponse("مفيش حجز بالرقم ده"),
          409: errorResponse("الميعاد الجديد محجوز"),
        },
      },
    },
 
    "/api/v1/bookings/{id}/cancel": {
      patch: {
        tags: ["Bookings"],
        summary: "إلغاء حجز",
        description: "الحجز المدفوع مينفعش يتلغى.",
        security: secured,
        parameters: [idParam],
        responses: {
          200: { description: "اتلغى الحجز" },
          400: errorResponse("الحجز ملغي بالفعل أو مدفوع أو منتهي"),
          401: errorResponse("مش مسجّل دخول"),
          403: errorResponse("الحجز مش بتاعك"),
          404: errorResponse("مفيش حجز بالرقم ده"),
        },
      },
    },
 
    "/api/v1/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Webhook بتاع Paymob (مش للاستخدام اليدوي)",
        description:
          "Paymob هي اللي بتنادي الـ endpoint ده بعد الدفع. الطلب لازم يحمل `hmac` صحيح في الـ query، وإلا بيترفض بـ 401.",
        parameters: [
          {
            name: "hmac",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "تم الاستلام" },
          401: errorResponse("توقيع HMAC غلط"),
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
          message: { type: "string", example: "this appointment is already booked" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1c2a9e4b0a1d2c3e4f567" },
          user: { type: "string" },
          name: { type: "string", example: "Ahmed Ali" },
          phone: { type: "string", example: "01012345678" },
          description: { type: "string", example: "كشف جديد" },
          date: { type: "string", example: "2026-10-25" },
          startTime: { type: "string", example: "10:00" },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled", "finished"],
          },
          paymentMethod: { type: "string", enum: ["online", "onsite"] },
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
          description: { type: "string", maxLength: 300, example: "كشف جديد" },
          date: { type: "string", example: "2026-10-25" },
          startTime: { type: "string", example: "10:00" },
          paymentMethod: { type: "string", enum: ["online", "onsite"] },
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