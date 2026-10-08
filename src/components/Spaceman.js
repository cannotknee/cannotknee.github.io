import { useGLTF } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'

// World-space z of the gaze target along the cursor ray (camera sits at z=6).
const LOOK_DEPTH = 3

export function Spaceman(props) {
  const { nodes, materials } = useGLTF('/spaceman.glb')
  const groupRef = useRef()
  const [dummy] = useState(() => new THREE.Object3D())

  const [target] = useState(() => new THREE.Vector3())
  const [rayDir] = useState(() => new THREE.Vector3())

  const mouse     = useRef({ x: 0, y: 0 })
  const hasMouse  = useRef(false)
  const scrollVel = useRef(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onMouseMove = (e) => {
      hasMouse.current = true
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    const onScroll = () => {
      scrollVel.current = window.scrollY - lastScrollY.current
      lastScrollY.current = window.scrollY
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useFrame((state, dt) => {
    const group = groupRef.current
    dummy.position.copy(group.position)
    if (hasMouse.current) {
      // The dog is rarely at screen centre, so aim at a point on the cursor's
      // camera ray (projects exactly onto the cursor) rather than at a fixed
      // offset from the dog's own origin. Picking the point partway to the
      // camera keeps head turns gentle when the cursor is right beside it.
      const { camera } = state
      rayDir.set(mouse.current.x, mouse.current.y, 0.5).unproject(camera).sub(camera.position).normalize()
      const travel = (LOOK_DEPTH - camera.position.z) / rayDir.z
      target.copy(camera.position).addScaledVector(rayDir, travel)
      // Fast scroll tilts the dog up/down
      target.y += scrollVel.current * 0.02
      group.parent.worldToLocal(target)
    } else {
      target.set(group.position.x, group.position.y, group.position.z + 1)
    }
    dummy.lookAt(target)
    easing.dampQ(group.quaternion, dummy.quaternion, 0.15, dt)
    scrollVel.current *= 0.88 // decay each frame so it returns to mouse tracking
  })

  return (
    <group ref={groupRef} {...props} position={[0, 0.07, 0]} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.364}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh geometry={nodes.Object_6.geometry} material={materials['Material.001']} rotation={[-Math.PI / 2, 0, 0]} />
            <mesh geometry={nodes.Object_9.geometry} material={materials['default']} rotation={[-Math.PI / 2, 0, 0]} />
            <mesh geometry={nodes.Object_12.geometry} material={materials['default']} rotation={[-Math.PI / 2, 0, 0]} />
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/spaceman.glb')
