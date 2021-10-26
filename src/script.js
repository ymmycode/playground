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

// * BACKGROUND
const background = textureLoader.load(`bg/bggrad.png`)
scene.background = background

// * ENVIRONMENT
const environment = cubeTextureLoader.load([
    `env/px.png`,
    `env/nx.png`,
    `env/py.png`,
    `env/ny.png`,
    `env/pz.png`,
    `env/nz.png`
])
scene.environment = environment

// * IMPORT MODEL with ANIMATION
let mixer = null

gltfLoader.load(
    `Floating-Playground/playground.glb`,
    (gltf) => 
    {
        mixer = new THREE.AnimationMixer(gltf.scene)
        const clips = gltf.animations || []

        for (let i = 0; i < 503; i++)
        {
            setTimeout(
                () => 
                {
                    mixer.clipAction(clips[i]).play()
                }, 10 * i
            )
        }

        scene.add(gltf.scene)
    }
)

// * LIGHTING
// Ambient
const ambientLight = new THREE.AmbientLight()
ambientLight.intensity = 0.5
ambientLight.color = new THREE.Color(`#FFDCED`)
scene.add(ambientLight)

// Directional
const sunLight = new THREE.DirectionalLight()
sunLight.intensity = .6
sunLight.position.set(-60, 100, 100)
sunLight.color = new THREE.Color(`#FFF8B4`)
scene.add(sunLight)

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
camera.position.set(-15, 8, 21)
scene.add(camera)

// * RENDERER 
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.LinearToneMapping
renderer.toneMappingExposure = 1.05
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
    animationSpeed: .7
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

    // Mixer Update
    mixer && mixer.update(deltaTime)

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


// * DEBUG
gui
.add(configParam, `animationSpeed`).name(`Animation Speed`)
.min(0.1).max(3).step(0.001)

gui
.add(ambientLight, `intensity`).name(`Ambient Light Intensity`)
.min(0.1).max(3).step(0.001)

gui
.add(sunLight, `intensity`).name(`Sun Light Intensity`)
.min(0.1).max(3).step(0.001)
