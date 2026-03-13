import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { helicopterApi, helicopterKeys } from '../lib/api'

export default function HelicopterList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: helicopters, isPending, error } = useQuery({
    queryKey: helicopterKeys.all,
    queryFn: helicopterApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => helicopterApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: helicopterKeys.all }),
    onError: (err) => alert(err.message),
  })

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete helicopter "${name}"?`)) return
    deleteMutation.mutate(id)
  }

  if (isPending) return <div className="loading">Loading helicopters...</div>
  if (error) return <div className="error">Error: {error.message}</div>

  return (
    <div className="helicopter-list">
      <div className="header">
        <h1>My Helicopters</h1>
        <button onClick={() => navigate('/helicopters/new')} className="btn-primary">
          Add Helicopter
        </button>
      </div>

      {helicopters.length === 0 ? (
        <div className="empty-state">
          <p>No helicopters added yet</p>
          <button onClick={() => navigate('/helicopters/new')} className="btn-primary">
            Add Your First Helicopter
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Total Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {helicopters.map((heli) => (
                <tr key={heli.id}>
                  <td>
                    <button
                      onClick={() => navigate(`/helicopters/${heli.id}`)}
                      className="link-button"
                    >
                      {heli.name}
                    </button>
                  </td>
                  <td>{heli.model}</td>
                  <td>{heli.manufacturer || '-'}</td>
                  <td>{heli.totalHours.toFixed(2)}h</td>
                  <td>
                    <button
                      onClick={() => navigate(`/helicopters/${heli.id}/edit`)}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(heli.id, heli.name)}
                      className="btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
