import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { helicopterApi } from '../lib/api'

interface FormData {
  name: string
  model: string
  manufacturer: string
  rotorDiameter: string
  weight: string
  maintenanceInterval: string
}

export default function HelicopterForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    model: '',
    manufacturer: '',
    rotorDiameter: '',
    weight: '',
    maintenanceInterval: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditMode)

  useEffect(() => {
    if (isEditMode && id) {
      loadHelicopter(parseInt(id))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode])

  const loadHelicopter = async (heliId: number) => {
    try {
      setLoading(true)
      const response = await helicopterApi.getById(heliId)
      const heli = response.data
      setFormData({
        name: heli.name,
        model: heli.model,
        manufacturer: heli.manufacturer || '',
        rotorDiameter: heli.rotorDiameter?.toString() || '',
        weight: heli.weight?.toString() || '',
        maintenanceInterval: heli.maintenanceInterval?.toString() || '',
      })
    } catch {
      alert('Failed to load helicopter')
      navigate('/helicopters')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.model.trim()) newErrors.model = 'Model is required'
    
    if (formData.rotorDiameter && parseFloat(formData.rotorDiameter) <= 0) {
      newErrors.rotorDiameter = 'Must be positive'
    }
    if (formData.weight && parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Must be positive'
    }
    if (formData.maintenanceInterval && parseFloat(formData.maintenanceInterval) <= 0) {
      newErrors.maintenanceInterval = 'Must be positive'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    try {
      setSubmitting(true)
      
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        model: formData.model.trim(),
      }
      
      if (formData.manufacturer) payload.manufacturer = formData.manufacturer.trim()
      if (formData.rotorDiameter) payload.rotorDiameter = parseFloat(formData.rotorDiameter)
      if (formData.weight) payload.weight = parseFloat(formData.weight)
      if (formData.maintenanceInterval) payload.maintenanceInterval = parseFloat(formData.maintenanceInterval)
      
      if (isEditMode && id) {
        await helicopterApi.update(parseInt(id), payload)
      } else {
        await helicopterApi.create(payload)
      }
      navigate('/helicopters')
    } catch (err) {
      const errorMsg = err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data
        ? String(err.response.data.error) : `Failed to ${isEditMode ? 'update' : 'create'} helicopter`
      if (errorMsg.includes('already exists')) {
        setErrors({ name: 'A helicopter with this name already exists' })
      } else {
        alert(errorMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="helicopter-form">
      <h1>{isEditMode ? 'Edit Helicopter' : 'Add Helicopter'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model *</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={errors.model ? 'error' : ''}
          />
          {errors.model && <span className="error-message">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer">Manufacturer</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rotorDiameter">Rotor Diameter (mm)</label>
            <input
              type="number"
              id="rotorDiameter"
              name="rotorDiameter"
              value={formData.rotorDiameter}
              onChange={handleChange}
              className={errors.rotorDiameter ? 'error' : ''}
            />
            {errors.rotorDiameter && <span className="error-message">{errors.rotorDiameter}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className={errors.weight ? 'error' : ''}
            />
            {errors.weight && <span className="error-message">{errors.weight}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maintenanceInterval">Maintenance Interval (hours)</label>
          <input
            type="number"
            step="0.1"
            id="maintenanceInterval"
            name="maintenanceInterval"
            value={formData.maintenanceInterval}
            onChange={handleChange}
            className={errors.maintenanceInterval ? 'error' : ''}
          />
          {errors.maintenanceInterval && <span className="error-message">{errors.maintenanceInterval}</span>}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/helicopters')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Helicopter' : 'Create Helicopter')}
          </button>
        </div>
      </form>
    </div>
  )
}
