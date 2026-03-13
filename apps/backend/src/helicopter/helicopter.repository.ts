import {
  Helicopter,
  HelicopterDetail,
  CreateHelicopterInput,
  UpdateHelicopterInput,
} from './helicopter.types'

export interface HelicopterRepository {
  findAll(): Promise<Helicopter[]>
  findById(id: number): Promise<HelicopterDetail | null>
  findByName(name: string): Promise<Helicopter | null>
  create(input: CreateHelicopterInput): Promise<Helicopter>
  update(id: number, input: UpdateHelicopterInput): Promise<Helicopter>
  delete(id: number): Promise<void>
  updateTotalHours(id: number, totalHours: number): Promise<void>
  updateLastMaintenance(id: number, date: Date): Promise<void>
}
