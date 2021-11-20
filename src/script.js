import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/dracoloader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import cameraTransitionVert from  './shaders/cameraTransition.vert'
import cameraTransitionFrag from  './shaders/cameraTransition.frag'
import loadMenuVert from './shaders/loadMenu.vert'
import loadMenuFrag from './shaders/loadMenu.frag'
import { wrap } from 'gsap/all'

// * LOADING MANAGER
const manager = new THREE.LoadingManager() 

// * DEBUG GUI
const gui = new dat.GUI()

// * Stats
const statsPanel = new Stats()
statsPanel.showPanel(2)
// document.body.appendChild(statsPanel.dom)

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
        globalSound.setVolume(3.0)
        globalSound.play()
    }
)

const music = audioLoader.load(
    `sounds/ill be waiting on the park, see you at noon.mp3`,
    (buffer) => 
    {
        sceneMusic.setBuffer(buffer)
        // sceneMusic.setLoop(true)
        sceneMusic.setVolume(0.4)
        // sceneMusic.play()
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

// * Shader uniforms 
const uniforms = {
    uTime: { value: 0 },
    transitionValue: {value: 0},
    transition2Value: {value: 0.23},
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
camera.position.set(-50, 17, 82)
camera.lookAt(0,0,0)
scene.add(camera)
camera.add(audioListener)

// * CINEMATIC CAMERA
// lookAt Point
const point = new THREE.Mesh(
    new THREE.BoxBufferGeometry(1,1,1),
    new THREE.MeshBasicMaterial({color: `#0000ff`, visible: false})
)
scene.add(point)

// TODO camera transition
const planeLoad = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
const planeTrans = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
const planeLoadingShader = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: loadMenuVert,
    fragmentShader: loadMenuFrag,
    transparent: true,
})
const planeTransitionShader = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: cameraTransitionVert,
    fragmentShader: cameraTransitionFrag,
    transparent: true,
})
const planeLoading = new THREE.Mesh(planeLoad, planeLoadingShader)
const planeTransition = new THREE.Mesh(planeTrans, planeTransitionShader)
// planeTransition.frustumCulled = false
// camera.add(planeLoading)
camera.add(planeTransition, planeLoading)

const transitionValue = 1500
const pointTime = 13900

const cinematic = () => 
{
    // set camera pos
    window.setTimeout(
        () => 
        {
            gsap.fromTo(camera.position, {x: -50, y: 17, z: 82}, {x: -15, y: 8, z: 21, duration: 10})
        },
        transitionValue
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime - transitionValue - 1000
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(-9.75, 2.75, 12.48)
            point.position.set(-1.93, 1.15, 0)
        },
        pointTime - transitionValue
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 2 - transitionValue - 3500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(10.16, 2.87, 14.58)
            point.position.set(1.15, 1.87, -4.14)
        },
        pointTime * 2 - transitionValue - 2500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 3 - transitionValue - 4500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(-5, 5.86, -12.03)
            point.position.set(-1.05, -2.37, -16.49)
        },
        pointTime * 3 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 4 - transitionValue - 4500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(-4.38, 9.56, -18.13)
            point.position.set(0.39, 0, -5.78)
        },
        pointTime * 4 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 5 - transitionValue - 4500
    )

    //  set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(1.3, 0.6, -9.5)
            point.position.set(-14.2, 3.43, -0.53)
        },
        pointTime * 5 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 6 - transitionValue - 4500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(-13.82, 2.21, -3.31)
            point.position.set(-2.25, -0.61, -3.58)
        },
        pointTime * 6 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 7 - transitionValue - 4500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(4.75, 0.63, -4.68)
            point.position.set(0, 1.152, 0)
        },
        pointTime * 7 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 8 - transitionValue - 4500
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            camera.position.set(8.92, 5.61, -5.28)
            point.position.set(3.35, -1.93, 0.943)
        },
        pointTime * 8 - transitionValue - 3500
    )

    //transition
    window.setTimeout(
        () => 
        {
            gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
            window.setTimeout(()=>
            {
                gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})
            }, 2000)
        },
        pointTime * 9 - transitionValue - 3000
    )

    // set camera pos
    window.setTimeout(
        () => 
        {
            point.position.set(0, 0, 0)
            gsap.fromTo(camera.position, {x: -15, y: 8, z: 21}, {x: -50, y: 17, z: 82, duration: 16})
            setTimeout(()=>
            {
                menuScreen()
            }, 11000)
        },
        pointTime * 9 - transitionValue - 2000
    )
}

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

// * ORBITCONTROLS
const control = new OrbitControls(camera, canvas)
control.target.set(0, 0, 0)
control.enableDamping = true
control.enabled = false

// * ANIMATE
const clock = new THREE.Clock()

let previousTime = 0
const configParam = {
    animationSpeed: .6,
    interval: 1000/35
}
let deltaTime = 0
let explore = false

const update = (time) => 
{
    gui.updateDisplay()

    // Control Update
    control.update()
    if(explore === false) camera.lookAt(point.position)

    // elapsed time
    const elapsedTime = clock.getElapsedTime()

    // Delta Time
    deltaTime = (time - previousTime) / 1000 * configParam.animationSpeed
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

// // * ADDITIONAL EVENT
// window.addEventListener(`keydown`, (evt) => 
// {
//     if(evt.code === `Space`)
//     {
        // audioListener.context.resume()
        // sceneMusic.play() 
        // cinematic()
//     }
// })

// * CONFIG
const wrapper = document.querySelector(`.wrapper`)
const wrapperResolution = 
{
    width: wrapper.clientWidth,
    height: wrapper.clientHeight
}

const clearScreen = ()=>
{
    gsap.fromTo(`.text1`, {opacity: 1}, {opacity: 0, duration: 2})
    gsap.fromTo(`.text1`, {y: 0}, {y: -500, duration: 2})
    gsap.fromTo(`.text2`, {opacity: 1}, {opacity: 0, duration: 2})
    gsap.fromTo(`.text2`, {y: 0}, {y: 500, duration: 1})
    gsap.fromTo(uniforms.transition2Value, {value: 0.23}, {value: 1.0, duration: 3})
    setTimeout(()=>{wrapper.style.zIndex = `-1`}, 2000)
}

const menuScreen = () => 
{
    gsap.fromTo(`.text1`, {opacity: 0}, {opacity: 1, duration: 2})
    gsap.fromTo(`.text1`, {y: -500}, {y: 0, duration: 2})
    gsap.fromTo(`.text2`, {opacity: 0}, {opacity: 1, duration: 2})
    gsap.fromTo(`.text2`, {y: 500}, {y: 0, duration: 2})
    gsap.fromTo(uniforms.transition2Value, {value: 1.0}, {value: 0.23, duration: 3})
    wrapper.style.zIndex = `0`
}

const enableControl = {
    exploreMode: () => 
    {
        clearScreen()
        gsap.fromTo(camera.position, {x: -50, y: 17, z: 82}, {x: -15, y: 8, z: 21, duration: 2, ease: `circ.out`})
        explore = true
        control.enabled = true
        control.target.set(0,0,0)
    },

    autoPlayMode: () => 
    {
        menuScreen()
        gsap.fromTo(camera.position, {x: -15, y: 8, z: 21}, {x: -50, y: 17, z: 82, duration: 2, ease: `circ.out`})
        explore = false
        control.enabled = false
        camera.position.set(-50, 17, 82)
        camera.lookAt(0,0,0)
    }
}

// * HTML
const startButton = document.querySelector(`.start-btn`)
const exploreButton = document.querySelector(`.explore-btn`)
const aboutButton = document.querySelector(`.about-btn`)
// const 

gsap.fromTo(`.text1`, {opacity: 0}, {opacity: 1, duration: 6, stagger: 1})
gsap.fromTo(`.text1`, {y: -500}, {y: 0, duration: 3, stagger: 1})

setTimeout(
    ()=>
    {
        gsap.fromTo(`.text2`, {opacity: 0}, {opacity: 1, duration: 3, stagger: 1})
        gsap.fromTo(`.text2`, {y: 500}, {y: 0, duration: 1, stagger: 1})
    }, 5000
)

startButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.start-btn`, {fontSize: 70, duration: 0.5})
})

startButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.start-btn`, {fontSize: 38, duration: 0.5})
})

exploreButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.explore-btn`, {fontSize: 70, duration: 0.5})
})

exploreButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.explore-btn`, {fontSize: 38, duration: 0.5})
})

aboutButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.about-btn`, {fontSize: 70, duration: 0.5})
})

aboutButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.about-btn`, {fontSize: 38, duration: 0.5})
})

startButton.addEventListener(`click`, ()=>
{
    clearScreen()
    audioListener.context.resume()
    sceneMusic.play() 
    cinematic()
})

exploreButton.addEventListener(`click`, enableControl.exploreMode)

// * DEBUG
const cameraConfig = gui.addFolder(`camera config`)
cameraConfig.open()

cameraConfig
.add(uniforms.transitionValue, `value`).name(`transition value`)
.min(0).max(1.5).step(0.001)

cameraConfig
.add(uniforms.transition2Value, `value`).name(`transition 2 value`)
.min(0).max(1).step(0.001)

cameraConfig
.add(camera.position, `x`).name(`camera x`)
.min(-100).max(100).step(0.001)

cameraConfig
.add(camera.position, `y`).name(`camera y`)
.min(-100).max(100).step(0.001)

cameraConfig
.add(camera.position, `z`).name(`camera z`)
.min(-100).max(100).step(0.001)

cameraConfig
.add(point.position, `x`).name(`look point x`)
.min(-20).max(20).step(0.001)

cameraConfig
.add(point.position, `y`).name(`look point y`)
.min(-20).max(20).step(0.001)

cameraConfig
.add(point.position, `z`).name(`look point z`)
.min(-20).max(20).step(0.001)

const lightConfig = gui.addFolder(`light Config`)

lightConfig
.add(configParam, `animationSpeed`).name(`Animation Speed`)
.min(0.1).max(3).step(0.001)

lightConfig
.add(ambientLight, `intensity`).name(`Ambient Light Intensity`)
.min(0.1).max(3).step(0.001)

lightConfig
.add(sunLight, `intensity`).name(`Sun Light Intensity`)
.min(0.1).max(3).step(0.001)

lightConfig
.add(bloomPass, `strength`).name(`Bloom Strength`)
.min(0).max(1).step(0.001)

const folder = gui.addFolder('FilmPass')
folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale')
folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity')
folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity')
folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count')

gui
.add(enableControl, `exploreMode`)

gui
.add(enableControl, `autoPlayMode`)

// gui.hide()

