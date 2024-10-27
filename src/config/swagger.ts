// swaggerConfig.ts
import swaggerJsDoc from "swagger-jsdoc";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Question Rotation Service API",
      version: "1.0.0",
      description: "API documentation for the Question Rotation Service",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}/api/v1`,
      },
    ],
  },
  apis: ["src/routes/v1/**/*.ts"],
};

export const swaggerDocs = swaggerJsDoc(swaggerOptions);
