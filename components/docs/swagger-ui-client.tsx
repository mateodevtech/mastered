"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function SwaggerUiClient() {
  return <SwaggerUI url="/api/openapi.json" />;
}
