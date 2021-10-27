import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/dracoloader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'

// * LOADING MANAGER
const manager = new THREE.LoadingManager() 

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
const gltfLoader = new GLTFLoader(manager)
gltfLoader.setDRACOLoader(dracoLoader)

// texture
const textureLoader = new THREE.TextureLoader(manager)

// cube texture
const cubeTextureLoader = new THREE.CubeTextureLoader(manager)

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

// ! Test material
// const materialTest = new THREE.MeshStandardMaterial({
//     color: new THREE.Color(`#ffffff`)
// })
// console.log(materialTest)

// * IMPORT MODEL with ANIMATION
let mixer, 
    sakuraMaterial, 
    grassMaterial, 
    bushMaterial,
    greenMaterial,
    yellowMaterial,
    lightGreenMaterial,
    mapleMaterial = null
const uniforms = {
    uTime: { value: 0 }
}

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

        grassMaterial = gltf.scene.children[3].children.find(child => child.name === `GrassStylized001`)
        grassMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.075, 0.05, `position.x`, `xz`)
        }

        bushMaterial = gltf.scene.children[3].children.find(child => child.name === `Bush003`)
        bushMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.075, 0.5, `position.z`, `xz`)
        }

        sakuraMaterial = gltf.scene.children[3].children.find(child => child.name === `Sakura1001`)
        sakuraMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.05, 0.9, `position.z`, `xy`)
        }

        greenMaterial = gltf.scene.children[3].children.find(child => child.name === `Green1001`)
        greenMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.055, 0.9, `position.z`, `yz`)
        }

        yellowMaterial = gltf.scene.children[3].children.find(child => child.name === `Yellow1001`)
        yellowMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.05, 0.9, `position.z`, `xy`)
        }

        lightGreenMaterial = gltf.scene.children[3].children.find(child => child.name === `LightGreen1001`)
        lightGreenMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.05, 0.6, `position.z`, `yz`)
        }

        mapleMaterial = gltf.scene.children[3].children.find(child => child.name === `Maple1001`)
        mapleMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.075, 0.9, `position.z`, `xy`)
        }

        //gltf.scene.children[3].children.material.wireframe = true

        scene.add(gltf.scene)
    }
)

function vertexDisplacement(shader, intensityMultiplier, angleMultiplier, pos, transformed)
{
    shader.uniforms.uTime = uniforms.uTime

        shader.vertexShader = shader.vertexShader.replace(
            `#include <common>`,
                `
                    #include <common>
                    uniform float uTime;
                    
                    mat2 rotate(float angle)
                    {
                        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));    
                    }
                `
            )

        shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `
                    #include <begin_vertex>
                    float angle = (sin(${pos} + uTime)) * ${intensityMultiplier};
                    mat2 rotateMatrix = rotate(sin(angle * ${angleMultiplier}));
                    transformed.${transformed} = rotateMatrix * transformed.${transformed};
                    
                `
            )
}

// * LIGHTING
// Ambient
const ambientLight = new THREE.AmbientLight()
ambientLight.intensity = 0.35
ambientLight.color = new THREE.Color(`#FFDCED`)
scene.add(ambientLight)

// Directional
const sunLight = new THREE.DirectionalLight()
sunLight.intensity = 0.2
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
    200
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
renderer.physicallyCorrectLights = true
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

// * POST-PROCESSING
// effect composer
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(resolution.width, resolution.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// render pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

// film pass
const filmPass = new FilmPass(
    0.9,
    0.1,
    224,
    false
)
filmPass.renderToScreen = true
effectComposer.addPass(filmPass)

// bloom pass
const bloomPass = new UnrealBloomPass()
bloomPass.threshold = 0.22
bloomPass.radius = 8.23
bloomPass.strength = 0.1
effectComposer.addPass(bloomPass)

// * ANIMATE
const clock = new THREE.Clock()

let previousTime = 0
const configParam = {
    animationSpeed: .8
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

    // update uniform
    uniforms.uTime.value = elapsedTime

    // Mixer Update
    mixer && mixer.update(deltaTime)

    // Update Renderer and Effect Composer
    // renderer.render(scene, camera)
    effectComposer.render()
    renderer.setSize(resolution.width, resolution.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    effectComposer.setSize(resolution.width, resolution.width)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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

gui
.add(bloomPass, `strength`).name(`Bloom Strength`)
.min(0).max(1).step(0.001)

const folder = gui.addFolder('FilmPass');
folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale');
folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity');
folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity');
folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count');