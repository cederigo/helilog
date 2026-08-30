import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { ModelService } from './model.service'
import { ModelRepository } from './model.repository'
import { FlightRepository } from '../flight/flight.repository'
import { ModelDetail } from './model.types'
import { normalizeModelName } from './model.name'
import {
  ModelNotFoundError,
  ModelMergeIntoSelfError,
  DuplicateModelNameError,
} from './model.errors'

function makeModel(id: number, name: string): ModelDetail {
  return {
    id,
    name,
    maintenanceInterval: null,
    lastMaintenance: null,
    importId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    maintenance: [],
  }
}

class FakeModelRepository implements ModelRepository {
  models = new Map<number, ModelDetail>()
  mergeCalls: { targetId: number; sourceId: number }[] = []
  nextId = 1

  async findAll() {
    return [...this.models.values()]
  }
  async findById(id: number) {
    return this.models.get(id) ?? null
  }
  async findByName(name: string) {
    return [...this.models.values()].find((m) => m.name === name) ?? null
  }
  async findByNormalizedName(name: string) {
    const key = normalizeModelName(name)
    return [...this.models.values()].find((m) => normalizeModelName(m.name) === key) ?? null
  }
  async create(input: { name: string }) {
    const id = Math.max(this.nextId, ...this.models.keys(), 0) + 1
    this.nextId = id + 1
    const model = makeModel(id, input.name)
    this.models.set(id, model)
    return model
  }
  async update(): Promise<never> {
    throw new Error('not implemented')
  }
  async delete() {}
  async merge(targetId: number, sourceId: number) {
    this.mergeCalls.push({ targetId, sourceId })
    this.models.delete(sourceId)
  }
  async updateLastMaintenance() {}
}

const flightRepo = {} as FlightRepository

describe('ModelService.merge', () => {
  let repo: FakeModelRepository
  let service: ModelService

  beforeEach(() => {
    repo = new FakeModelRepository()
    repo.models.set(1, makeModel(1, 'Logo 200'))
    repo.models.set(2, makeModel(2, 'Logo200'))
    service = new ModelService(repo, flightRepo)
  })

  it('reassigns the source into the target and returns the target detail', async () => {
    const result = await service.merge(1, 2)

    assert.deepEqual(repo.mergeCalls, [{ targetId: 1, sourceId: 2 }])
    assert.equal(result.id, 1)
    assert.equal(repo.models.has(2), false)
  })

  it('rejects merging a model into itself', async () => {
    await assert.rejects(() => service.merge(1, 1), ModelMergeIntoSelfError)
    assert.deepEqual(repo.mergeCalls, [])
  })

  it('throws when the target does not exist', async () => {
    await assert.rejects(() => service.merge(99, 2), ModelNotFoundError)
    assert.deepEqual(repo.mergeCalls, [])
  })

  it('throws when the source does not exist', async () => {
    await assert.rejects(() => service.merge(1, 99), ModelNotFoundError)
    assert.deepEqual(repo.mergeCalls, [])
  })
})

describe('ModelService.create', () => {
  let repo: FakeModelRepository
  let service: ModelService

  beforeEach(() => {
    repo = new FakeModelRepository()
    repo.models.set(1, makeModel(1, 'Logo 700'))
    service = new ModelService(repo, flightRepo)
  })

  it('rejects a name that normalizes to an existing model', async () => {
    await assert.rejects(() => service.create({ name: 'logo700' }), DuplicateModelNameError)
    await assert.rejects(() => service.create({ name: 'LOGO-700' }), DuplicateModelNameError)
  })

  it('creates a genuinely new model', async () => {
    const created = await service.create({ name: 'Oxy 5' })
    assert.equal(created.name, 'Oxy 5')
    assert.equal((await repo.findByNormalizedName('oxy5')) !== null, true)
  })
})
