import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line } from '@react-three/drei'

type Scenario = {
  id: string
  name: string
  description: string
  movementType: string
  pathPoints: Array<{ x: number; y: number; z: number }>
}

type Scene3DCanvasProps = {
  activeScenario?: Scenario
}

export default function Scene3DCanvas({ activeScenario }: Scene3DCanvasProps) {
  const points = activeScenario?.pathPoints ?? [
    { x: 0, y: 0, z: 0 },
    { x: 1.2, y: 0, z: 1.2 },
    { x: 2.6, y: 0, z: 2.1 },
  ]

  return (
    <div className="h-[320px] w-full overflow-hidden rounded">
      <Canvas camera={{ position: [4, 3.2, 6], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.7} sectionSize={2} sectionThickness={1.2} />
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <Line points={points.map((point) => [point.x, point.y + 0.02, point.z])} color="#f59e0b" lineWidth={2} />
        {points.map((point, index) => (
          <mesh key={`${point.x}-${point.z}-${index}`} position={[point.x, 0.2, point.z]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial color={index === 0 ? '#f59e0b' : '#e2e8f0'} />
          </mesh>
        ))}
        <OrbitControls enablePan={false} enableZoom={true} maxDistance={9} minDistance={3} />
      </Canvas>
    </div>
  )
}
