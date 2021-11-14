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

// audio loader
const audioLoader = new THREE.AudioLoader(manager)

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

// * SOUNDS
const audioListener = new THREE.AudioListener()
const globalSound = new THREE.Audio(audioListener)
const sceneMusic = new THREE.Audio(audioListener)
const globalPositionalSound = new THREE.PositionalAudio(audioListener)

const environmentSound = audioLoader.load(
    `sounds/environment.mp3`,
    (buffer) => 
    {
        globalSound.setBuffer(buffer)
        globalSound.setLoop(true)
        globalSound.setVolume(2.0)
        globalSound.play()
    }
)

const music = audioLoader.load(
    `sounds/ill be waiting on the park, see you at noon.mp3`,
    (buffer) => 
    {
        sceneMusic.setBuffer(buffer)
        sceneMusic.setLoop(true)
        sceneMusic.setVolume(0.4)
        sceneMusic.play()
    }
)

const swingSqueak = audioLoader.load(
    `sounds/swingsqueak.mp3`,
    (buffer) => 
    {
        window.setTimeout(
            () => {
                globalPositionalSound.setBuffer(buffer)
                globalPositionalSound.setLoop(true)
                globalPositionalSound.setVolume(1.8)
                globalPositionalSound.setRefDistance(10)
                globalPositionalSound.play()
            },10
        )
    }
)

const swingSqueakPosition = new THREE.Mesh(
    new THREE.BoxBufferGeometry(3, 3, 1),
    new THREE.MeshBasicMaterial({color: `#fff`, visible: false})
)
swingSqueakPosition.position.set(-7.2, 1, -4.2)
scene.add(swingSqueakPosition)
swingSqueakPosition.add(globalPositionalSound)

// const positionalHelper = new PositionalAudioHelper(globalPositionalSound)
// globalPositionalSound.add(positionalHelper)

audioListener.context.resume()
window.addEventListener(`keydown`, (evt) => 
{
    if(evt.code === `Space`)
    {
        // audioContext.resume()
        audioListener.context.resume()
    }
})


// * IMPORT MODEL with ANIMATION
let mixer, 
    grassMaterial, 
    bushMaterial,
    treeLeavesGroup,
    sakuraMaterial, 
    greenMaterial,
    yellowMaterial,
    lightGreenMaterial,
    lightGreenMaterial2,
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

        for (let i = 0; i < 132; i++)
        {
            const delay = i > 1 ? 20 * i : 10
            setTimeout(
                () => 
                {
                    mixer.clipAction(clips[i]).play()
                }, delay
            )
        }
        
        treeLeavesGroup = gltf.scene.children[1].children.find(child => child.name === `TreeLeaves`) 

        grassMaterial = gltf.scene.children[1].children.find(child => child.name === `GrassStylized1001`)
        grassMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.06, 0.05, `position.x`, `xz`)
        }

        bushMaterial = gltf.scene.children[1].children.find(child => child.name === `Bushes`)
        bushMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.035, 0.1, `position.z`, `xz`)
        }

        sakuraMaterial = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_2`)
        sakuraMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.03, 0.1, `position.z`, `xz`)
        }

        greenMaterial = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_1`)
        greenMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.03, 0.2, `position.z`, `xz`)
        }

        yellowMaterial = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_4`)
        yellowMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.045, 0.125, `position.y`, `xy`)
        }

        lightGreenMaterial = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_5`)
        lightGreenMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.065, 0.2, `position.z`, `yz`)
        }

        lightGreenMaterial2 = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_6`)
        lightGreenMaterial2.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.04, 0.125, `position.z`, `yz`)
        }

        mapleMaterial = treeLeavesGroup.children.find(child => child.name === `TreeLeaves_3`)
        mapleMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.025, 0.125, `position.y`, `xy`)
        }

        //gltf.scene.children[3].children.material.wireframe = true

        scene.add(gltf.scene)
    }
)

function vertexDisplacement(shader, intensityMultiplier, angleMultiplier, pos, transformed)
{
    // shader.precision = `lowp`
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
camera.add(audioListener)

// * RENDERER 
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    // precision: `mediump`
})
renderer.compile(scene, camera)
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
effectComposer.addPass(filmPass)

// bloom pass
const bloomPass = new UnrealBloomPass()
bloomPass.threshold = 0.22
bloomPass.radius = 8.23
bloomPass.strength = 0.11
effectComposer.addPass(bloomPass)

// * ANIMATE
const clock = new THREE.Clock()

let previousTime = 0
const configParam = {
    animationSpeed: .6,
    interval: 1000/35
}
let deltaTime = 0

const update = (time) => 
{
    // Control Update
    control.update()

    // elapsed time
    const elapsedTime = clock.getElapsedTime()

    // Delta Time
    deltaTime = (time - previousTime) / 1000 * configParam.animationSpeed
    previousTime = time
    // console.log(deltaTime)

    // deltaTime += clock.getDelta()
    // console.log(delta)

    // update uniform
    uniforms.uTime.value = elapsedTime

    // if(deltaTime > configParam.interval)
    // {

    // }

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
.add(swingSqueakPosition.position, `x`)
.min(-10).max(10).step(0.001)

gui
.add(swingSqueakPosition.position, `z`)
.min(-10).max(10).step(0.001)

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