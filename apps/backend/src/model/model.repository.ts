import { Model, ModelDetail, CreateModelInput, UpdateModelInput } from './model.types'

export interface ModelRepository {
  findAll(): Promise<Model[]>
  findById(id: number): Promise<ModelDetail | null>
  findByName(name: string): Promise<Model | null>
  create(input: CreateModelInput): Promise<Model>
  update(id: number, input: UpdateModelInput): Promise<Model>
  delete(id: number): Promise<void>
  updateLastMaintenance(id: number, date: Date): Promise<void>
}
