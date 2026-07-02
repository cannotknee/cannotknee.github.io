import { useGLTF } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'

export function Spaceman(props) {
  const { nodes, materials } = useGLTF('/spaceman.glb')
  const groupRef = useRef()
  const [dummy] = useState(() => new THREE.Object3D())

  const mouse     = useRef({ x: 0, y: 0 })
  const scrollVel = useRef(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onMouseMove = (e) => {
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
    dummy.position.set(0, 0, 0)
    // Blend mouse tracking with scroll-velocity tilt: fast scroll tilts the dog up/down
    dummy.lookAt(mouse.current.x, mouse.current.y + scrollVel.current * 0.009, 1)
    easing.dampQ(groupRef.current.quaternion, dummy.quaternion, 0.15, dt)
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
