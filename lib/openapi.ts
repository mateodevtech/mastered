// Hand-written OpenAPI 3.1 document for the public v1 API. Kept in sync
// manually with app/api/v1 — small enough surface that generating it from
// the Zod validators isn't worth the extra dependency yet.
export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Mastered API",
    version: "1.0.0",
    description:
      "API publique en lecture/écriture pour tes objectifs, tâches et séries. " +
      "Authentifie chaque requête avec une clé API créée dans Réglages → Clés API, " +
      "envoyée en en-tête `Authorization: Bearer <clé>`.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Goal: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          type: { type: "string", enum: ["one_off", "recurring", "long_term"] },
          status: { type: "string", enum: ["active", "completed", "abandoned"] },
          deadline: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          goalId: { type: "string", format: "uuid" },
          title: { type: "string" },
          deadline: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["pending", "done", "missed", "snoozed"] },
          notificationMode: { type: "string", enum: ["normal", "blocking"] },
          requiresProof: { type: "boolean" },
        },
      },
      Streak: {
        type: "object",
        properties: {
          goalId: { type: "string", format: "uuid" },
          currentCount: { type: "integer" },
          longestCount: { type: "integer" },
          freezesUsedThisMonth: { type: "integer" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/goals": {
      get: {
        summary: "Lister tes objectifs",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Goal" } },
              },
            },
          },
          "401": { description: "Clé API manquante ou invalide" },
        },
      },
      post: {
        summary: "Créer un objectif",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "type"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["one_off", "recurring"] },
                  deadline: { type: "string", format: "date-time" },
                  recurrenceTimesPerWeek: { type: "integer", minimum: 1, maximum: 14 },
                  customRewardText: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Créé",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } },
          },
          "400": {
            description: "Requête invalide",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/goals/{goalId}": {
      get: {
        summary: "Lire un objectif",
        parameters: [
          { name: "goalId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Goal" } } },
          },
          "404": { description: "Introuvable" },
        },
      },
    },
    "/tasks": {
      get: {
        summary: "Lister tes tâches",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Task" } },
              },
            },
          },
        },
      },
      post: {
        summary: "Créer une tâche",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["goalId", "title", "deadline"],
                properties: {
                  goalId: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  deadline: { type: "string", format: "date-time" },
                  notificationMode: { type: "string", enum: ["normal", "blocking"] },
                  isCriticalCommitment: { type: "boolean" },
                  requiresProof: { type: "boolean" },
                  proofType: { type: "string", enum: ["text", "photo", "checkbox"] },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Créée",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          "400": { description: "Requête invalide" },
          "404": { description: "Objectif introuvable" },
        },
      },
    },
    "/tasks/{taskId}": {
      get: {
        summary: "Lire une tâche",
        parameters: [
          { name: "taskId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          "404": { description: "Introuvable" },
        },
      },
    },
    "/tasks/{taskId}/complete": {
      post: {
        summary: "Marquer une tâche comme terminée",
        description:
          "Uniquement pour les tâches qui ne nécessitent pas de preuve — " +
          "déclenche l'événement webhook task.completed.",
        parameters: [
          { name: "taskId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } },
          },
          "400": { description: "Cette tâche nécessite une preuve" },
          "404": { description: "Introuvable" },
        },
      },
    },
    "/streaks": {
      get: {
        summary: "Lister tes séries",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Streak" } },
              },
            },
          },
        },
      },
    },
  },
};
