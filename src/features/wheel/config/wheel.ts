import type { WheelConfig, WheelResult, ResultId } from "../domain/types";

export const RESULTS = {
  coffee: {
    id: "coffee", label: "Kaffee", headline: "Ein Stück Thüringer Kaffeeglück.",
    description: "Premium-Kaffee von der Thüringer DenkMahl Rösterei",
  },
  wine: {
    id: "wine", label: "Wein", headline: "Auf dein Weinglück!",
    description: "Prämierter Wein vom Thüringer Weingut Bad Sulza",
  },
  mainPrize: {
    id: "mainPrize", label: "Hauptgewinn", headline: "Thüringen wartet auf dich!",
    description: "Hauptgewinn! „Hüfte“ mit deiner Visitenkarte & Newsletter-Anmeldung in den Lostopf für einen Freiplatz auf unserer B2B-Entdeckungsreise vom 29. bis 31.10.26",
  },
  noPrize: {
    id: "noPrize", label: "Niete", headline: "Zum Glück gibt’s Thüringen.",
    description: "Niete – aber keine Sorge, in Thüringen geht niemand leer aus! Melde dich zu unserem Newsletter an & folge uns bei LinkedIn!",
  },
} as const satisfies Record<ResultId, WheelResult>;

export const WHEEL_CONFIG = {
  results: RESULTS,
  segments: [
    { id: "coffee-1", resultId: "coffee", fill: "#F6FBFF", foreground: "#9A542A" },
    { id: "wine-1", resultId: "wine", fill: "#DDEFFA", foreground: "#A6245C" },
    { id: "main-prize-1", resultId: "mainPrize", fill: "#F6FBFF", foreground: "#E9A900" },
    { id: "no-prize-1", resultId: "noPrize", fill: "#DDEFFA", foreground: "#435167" },
    { id: "wine-2", resultId: "wine", fill: "#F6FBFF", foreground: "#A6245C" },
    { id: "coffee-2", resultId: "coffee", fill: "#DDEFFA", foreground: "#9A542A" },
    { id: "no-prize-2", resultId: "noPrize", fill: "#F6FBFF", foreground: "#435167" },
    { id: "main-prize-2", resultId: "mainPrize", fill: "#DDEFFA", foreground: "#E9A900" },
  ],
} as const satisfies WheelConfig;
