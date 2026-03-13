import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { helicopterApi, helicopterKeys } from '../lib/api'
import { createHelicopterSchema, type CreateHelicopterInput, type UpdateHelicopterInput } from '@helilog/shared'

export default function HelicopterForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateHelicopterInput>({
    resolver: zodResolver(createHelicopterSchema),
  })

  const { isPending: loadingExisting } = useQuery({
    queryKey: helicopterKeys.detail(parseInt(id!)),
    queryFn: () => helicopterApi.getById(parseInt(id!)),
    enabled: isEditMode,
    staleTime: Infinity,
    select: (heli) => {
      const defaults: UpdateHelicopterInput = {
        name: heli.name,
        model: heli.model,
        ...(heli.manufacturer != null && { manufacturer: heli.manufacturer }),
        ...(heli.rotorDiameter != null && { rotorDiameter: heli.rotorDiameter }),
        ...(heli.weight != null && { weight: heli.weight }),
        ...(heli.maintenanceInterval != null && { maintenanceInterval: heli.maintenanceInterval }),
      }
      reset(defaults)
      return heli
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: CreateHelicopterInput) => {
      const payload: CreateHelicopterInput = {
        name: data.name.trim(),
        model: data.model.trim(),
        ...(data.manufacturer && { manufacturer: data.manufacturer.trim() }),
        ...(data.rotorDiameter != null && !isNaN(data.rotorDiameter) && { rotorDiameter: data.rotorDiameter }),
        ...(data.weight != null && !isNaN(data.weight) && { weight: data.weight }),
        ...(data.maintenanceInterval != null && !isNaN(data.maintenanceInterval) && { maintenanceInterval: data.maintenanceInterval }),
      }
      if (isEditMode && id) {
        return helicopterApi.update(parseInt(id), payload)
      }
      return helicopterApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: helicopterKeys.all })
      navigate('/helicopters')
    },
    onError: (err) => {
      if (err.message.includes('already exists')) {
        setError('name', { message: 'A helicopter with this name already exists' })
      } else {
        alert(err.message)
      }
    },
  })

  if (isEditMode && loadingExisting) return <div className="loading">Loading...</div>

  return (
    <div className="helicopter-form">
      <h1>{isEditMode ? 'Edit Helicopter' : 'Add Helicopter'}</h1>

      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model *</label>
          <input
            type="text"
            id="model"
            {...register('model')}
            className={errors.model ? 'error' : ''}
          />
          {errors.model && <span className="error-message">{errors.model.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer">Manufacturer</label>
          <input
            type="text"
            id="manufacturer"
            {...register('manufacturer')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rotorDiameter">Rotor Diameter (mm)</label>
            <input
              type="number"
              id="rotorDiameter"
              {...register('rotorDiameter', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
              className={errors.rotorDiameter ? 'error' : ''}
            />
            {errors.rotorDiameter && <span className="error-message">{errors.rotorDiameter.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              id="weight"
              {...register('weight', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
              className={errors.weight ? 'error' : ''}
            />
            {errors.weight && <span className="error-message">{errors.weight.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maintenanceInterval">Maintenance Interval (hours)</label>
          <input
            type="number"
            step="0.1"
            id="maintenanceInterval"
            {...register('maintenanceInterval', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
            className={errors.maintenanceInterval ? 'error' : ''}
          />
          {errors.maintenanceInterval && <span className="error-message">{errors.maintenanceInterval.message}</span>}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/helicopters')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Helicopter' : 'Create Helicopter')}
          </button>
        </div>
      </form>
    </div>
  )
}
