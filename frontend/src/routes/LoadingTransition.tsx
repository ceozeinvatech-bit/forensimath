import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ForensicLoader from '../components/loading/ForensicLoader'

const LOADING_DURATION_MS = 2500

export default function LoadingTransition() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, LOADING_DURATION_MS)

    return () => clearTimeout(timer)
  }, [navigate])

  return <ForensicLoader />
}
