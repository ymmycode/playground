import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/dracoloader'


// * DEBUG GUI
const gui = new dat.GUI()

// * Stats
const statsPanel = new Stats()
statsPanel.showPanel(2)
document.body.appendChild(statsPanel.dom)

// * DOM
const canvas = document.querySelector(`.webgl`)

// * SCENE
const scene = new THREE.Scene()

// * LOADER
//draco
const dracoPath = `/draco/`
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(dracoPath)

// gltf
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// texture
const textureLoader = new THREE.TextureLoader()

// cube texture
const cubeTextureLoader = new THREE.CubeTextureLoader()

// * IMPORT MODEL
gltfLoader.load(
    `Floating-Playground/playground.glb`,
    (gltf) => 
    {
        scene.add(gltf.scene)
    }
)

// * ASPECT RATIO / RESOLUTION
const resolution = 
{
    width: window.innerWidth,
    height: window.innerHeight
}

// * CAMERA
const camera = new THREE.PerspectiveCamera(
    50,
    resolution.width / resolution.height,
    0.01,
    2000
)
camera.position.set(30, 30, 30)
scene.add(camera)

// * RENDERER 
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(resolution.width, resolution.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// * CONTROLS
const control = new OrbitControls(camera, canvas)
control.target.set(0, 0, 0)
control.enableDamping = true

// * RESIZE UPDATE
window.addEventListener(`resize`, () => 
{
    // Update resolution
    resolution.width = window.innerWidth
    resolution.height = window.innerHeight

    // Update camera aspect
    camera.aspect = resolution.width / resolution.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(resolution.width, resolution.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// * ANIMATE
const clock = new THREE.Clock()

let previousTime = 0
const configParam = {
    animationSpeed: 1
}

const update = (time) => 
{
    // Control Update
    control.update()

    // elapsed time
    const elapsedTime = clock.getElapsedTime()

    // Delta Time
    const deltaTime = (time - previousTime) / 1000 * configParam.animationSpeed
    previousTime = time

    // Update Render
    renderer.render(scene, camera)
    renderer.setSize(resolution.width, resolution.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Stats Panel
    statsPanel.update()

    // update frame
    requestAnimationFrame(update)
}
update()