import type {
  CreateHelicopterInput,
  UpdateHelicopterInput,
} from "@helilog/shared";
import type { Flight } from "../flight/flight.types";
import type { MaintenanceRecord } from "../maintenance/maintenance.types";
import type { Helicopter } from "@prisma/client";

export type { Helicopter };
export interface HelicopterDetail extends Helicopter {
  flights: Flight[];
  maintenance: MaintenanceRecord[];
}

export type { CreateHelicopterInput, UpdateHelicopterInput };
