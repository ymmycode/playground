import './style.css'
import * as THREE from 'three'
// import * as dat from 'dat.gui'
// import Stats from 'three/examples/jsm/libs/stats.module.js'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import cameraTransitionVert from  './shaders/cameraTransition.vert'
import cameraTransitionFrag from  './shaders/cameraTransition.frag'
import loadMenuVert from './shaders/loadMenu.vert'
import loadMenuFrag from './shaders/loadMenu.frag'
import isMobile from 'is-mobile'

// * LOADING SCREEN
const loadingScreen = document.querySelector(`.loading-screen`)
const loadCounter = document.querySelector(`.counter`)
const engageButton = document.querySelector(`.loading-btn`)

engageButton.addEventListener(`click`, ()=>
{
    loadingScreen.classList.add(`hide`)
    setTimeout(()=>{
        loadingScreen.style.zIndex = `-1`
    },1000)
    audioListener.context.resume()
    isMobile({tablet: true}) && toggleForceLandscapeFullscreen()
    mainMenu()
})

// * LOADING MANAGER
const manager = new THREE.LoadingManager(
    //Loaded
    ()=>
    {
        setTimeout(
            ()=>
            {
                engageButton.classList.add(`visible`)
            }, 1000
        )
    },

    //Progress
    (_, itemsLoaded, itemsTotal)=>
    {
        const progress = (itemsLoaded / itemsTotal) * 100;
        loadCounter.textContent = `${Math.round(progress)}%`
    }
) 

// * DEBUG GUI
// const gui = new dat.GUI()

// * Stats
// const statsPanel = new Stats()
// statsPanel.showPanel(2)
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
        globalSound.setVolume(3.6)
        globalSound.play()
    }
)

const music = audioLoader.load(
    `sounds/ill be waiting on the park, see you at noon.mp3`,
    (buffer) => 
    {
        sceneMusic.setBuffer(buffer)
        // sceneMusic.setLoop(true)
        sceneMusic.setVolume(0.6)
        sceneMusic.play()
        sceneMusic.stop()
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
                globalPositionalSound.setVolume(1.45)
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
        
        const floatingGround = gltf.scene.children.find(child => child.name === `Floating_Ground001`)
        treeLeavesGroup = floatingGround.children.find(child => child.name === `TreeLeaves`) 

        grassMaterial = floatingGround.children.find(child => child.name === `GrassStylized1001`)
        grassMaterial.material.onBeforeCompile = (shader) => 
        {
            vertexDisplacement(shader, 0.06, 0.05, `position.x`, `xz`)
        }
        grassMaterial.material.depthWrite = false

        bushMaterial = floatingGround.children.find(child => child.name === `Bushes`)
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
    45,
    resolution.width / resolution.height,
    0.01,
    200
)
camera.position.set(-50, 17, 82)
camera.lookAt(0,0,0)
scene.add(camera)
camera.add(audioListener)

// * CAMERA FRUSTUM
const frustum = new THREE.Frustum()
camera.updateMatrix()
camera.updateProjectionMatrix()
camera.matrixWorldInverse.invert(camera.matrixWorld)

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
camera.add(planeTransition, planeLoading)

const transitionValue = 1500
const pointTime = 13900
let cinematicAnimations = []
let cinTween = []

cinTween[1] = gsap.fromTo(uniforms.transitionValue, {value: 0}, {value: 1.5, duration: 1.5})
cinTween[2] = gsap.fromTo(uniforms.transitionValue, {value: 1.5}, {value: 0, duration: 1.5})

const cinematic = () => 
{
    // set camera pos
    cinematicAnimations[0] = 
    window.setTimeout(
        () => 
        {
            cinTween[0] = gsap.fromTo(camera.position, {x: -50, y: 17, z: 82}, {x: -15, y: 8, z: 21, duration: 10})
            cinTween[0].play(0)
        },
        transitionValue
    )

    //transition
    cinematicAnimations[1] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[17] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime - transitionValue - 1000
    )

    // set camera pos
    cinematicAnimations[2] = 
        window.setTimeout(
        () => 
        {
            camera.position.set(-9.75, 2.75, 12.48)
            point.position.set(-1.93, 1.15, 0)
        },
        pointTime - transitionValue
    )

    //transition
    cinematicAnimations[3] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[18] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 2 - transitionValue - 3500
    )

    // set camera pos
    cinematicAnimations[4] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(10.16, 2.87, 14.58)
            point.position.set(1.15, 1.87, -4.14)
        },
        pointTime * 2 - transitionValue - 2500
    )

    //transition
    cinematicAnimations[5] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[19] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 3 - transitionValue - 4500
    )

    // set camera pos
    cinematicAnimations[6] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(-5, 5.86, -12.03)
            point.position.set(-1.05, -2.37, -16.49)
        },
        pointTime * 3 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[7] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[20] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 4 - transitionValue - 4500
    )

    // set camera pos
    cinematicAnimations[8] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(-4.38, 9.56, -18.13)
            point.position.set(0.39, 0, -5.78)
        },
        pointTime * 4 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[9] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[21] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 5 - transitionValue - 4500
    )

    //  set camera pos
    cinematicAnimations[10] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(1.3, 0.6, -9.5)
            point.position.set(-14.2, 3.43, -0.53)
        },
        pointTime * 5 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[11] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[22] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 6 - transitionValue - 4500
    )

    // set camera pos
    cinematicAnimations[12] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(-13.82, 2.21, -3.31)
            point.position.set(-2.25, -0.61, -3.58)
        },
        pointTime * 6 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[13] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[23] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 7 - transitionValue - 4500
    )

    // set camera pos
    cinematicAnimations[14] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(4.75, 0.63, -4.68)
            point.position.set(0, 1.152, 0)
        },
        pointTime * 7 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[15] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[24] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 8 - transitionValue - 4500
    )

    // set camera pos
    cinematicAnimations[16] = 
    window.setTimeout(
        () => 
        {
            camera.position.set(8.92, 5.61, -5.28)
            point.position.set(3.35, -1.93, 0.943)
        },
        pointTime * 8 - transitionValue - 3500
    )

    //transition
    cinematicAnimations[27] = 
    window.setTimeout(
        () => 
        {
            cinTween[1].play(0)
            cinematicAnimations[25] = window.setTimeout(()=>
            {
                cinTween[2].play(0)
            }, 2000)
        },
        pointTime * 9 - transitionValue - 3000
    )

    // set camera pos
    cinematicAnimations[28] = 
    window.setTimeout(
        () => 
        {
            point.position.set(0, 0, 0)
            cinTween[3] = gsap.fromTo(camera.position, {x: -15, y: 8, z: 21}, {x: -50, y: 17, z: 82, duration: 16})
            cinTween[3].play(0)
            cinematicAnimations[26] = setTimeout(()=>
            {
                menuScreen()
            }, 11000)
        },
        pointTime * 9 - transitionValue - 2000
    )
}

const clearingTimeout = ()=>
{
    cinematicAnimations.forEach((animation)=>
    {
        clearTimeout(animation)
    })
}

const pausingTween = () => 
{
    cinTween.forEach((tween) => 
    {
        tween.pause()
    })
}

// * POINTS OF INTEREST !poi
const points = [
    {
        position: new THREE.Vector3(1.46, 0.582, -9.494),
        element: document.querySelector(`.point-0`)
    },

    {
        position: new THREE.Vector3(7, 4.67, -4.88),
        element: document.querySelector(`.point-1`)
    },

    {
        position: new THREE.Vector3(-0.256, 4.378, 0),
        element: document.querySelector(`.point-2`)
    },

    {
        position: new THREE.Vector3(-8.86, 2, 4.35),
        element: document.querySelector(`.point-3`)
    },

    {
        position: new THREE.Vector3(-3.39, 1.929, -14.442),
        element: document.querySelector(`.point-4`)
    },

    {
        position: new THREE.Vector3(-6.885, 2.256, -5.513),
        element: document.querySelector(`.point-5`)
    },
]

const hideAllPOI = ()=>
{
    points.forEach((point)=>
    {
        point.element.classList.remove(`visible`)
    })
}

const showAllPOI = ()=>
{
    points.forEach((point)=>
    {
        point.element.classList.add(`visible`)
    })
}

// * RENDERER 
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    // logarithmicDepthBuffer: true
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

// * CONTROLS
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
let swing = false
let fov = 45

const update = (time) => 
{
    // elapsed time
    const elapsedTime = clock.getElapsedTime()

    if(explore === true)
    {
        points.forEach((point) => 
        {
            const screenPosition = point.position.clone()
            screenPosition.project(camera)

            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            ))

            if(frustum.containsPoint(point.position))
            {
                hidePOI === false && point.element.classList.add(`visible`)
                hidePOI === true && point.element.classList.remove(`visible`)
            }
            else{point.element.classList.remove(`visible`)}

            const translateX = screenPosition.x * resolution.width * 0.5
            const translateY = - screenPosition.y * resolution.height * 0.5
            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
        })
    }

    if(swing === true) 
    {
        camera.fov = fov - Math.cos(fov + 10 - elapsedTime) 
        camera.updateProjectionMatrix()
    }

    // gui.updateDisplay()

    // Control Update
    control.update()
    if(explore === false) camera.lookAt(point.position)

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
    // statsPanel.update()

    // update frame
    requestAnimationFrame(update)

}
update()

// * CONFIG
const wrapper = document.querySelector(`.wrapper`)

const mainMenu = () => 
{
    gsap.fromTo(`.text1`, {opacity: 0}, {opacity: 1, duration: 6, stagger: 1})
    gsap.fromTo(`.text1`, {y: -500}, {y: 0, duration: 3, stagger: 1})

    gsap.fromTo(camera.position, {x: -15, y: 8, z: 21}, {x: -50, y: 17, z: 82, duration: 2, ease: `circ.out`})
    cinTween[2].play(0)
    gsap.fromTo(uniforms.transition2Value, {value: 1.0}, {value: 0.23, duration: 3})

    setTimeout(
        ()=>
        {
            gsap.fromTo(`.text2`, {opacity: 0}, {opacity: 1, duration: 1, stagger: 0.5})
            gsap.fromTo(`.text2`, {y: 500}, {y: 0, duration: 1, stagger: 0.5})
        }, 2500
    )
}

const clearScreen = () =>
{
    gsap.fromTo(`.text1`, {opacity: 1}, {opacity: 0, duration: 2})
    gsap.fromTo(`.text1`, {y: 0}, {y: -500, duration: 2})
    gsap.fromTo(`.text2`, {opacity: 1}, {opacity: 0, duration: 2})
    gsap.fromTo(`.text2`, {y: 0}, {y: 500, duration: 2})
    gsap.fromTo(uniforms.transition2Value, {value: 0.23}, {value: 1.0, duration: 3})
    setTimeout(()=>{wrapper.style.zIndex = `-1`; }, 1500)
}

const resetExploreMenu = () => 
{
    hidePOI = false
    musicPlay = false
    autoHideText[0].textContent = `Hide`
    autoHideText[1].textContent = `Play`
    sceneMusic.stop()
}

const exploreMenu = () => 
{
    setTimeout(()=>
    {
        backMenuButton.classList.add(`visible`)
        poiButton.classList.add(`visible`)
        playButton.classList.add(`visible`)
        stopButton.classList.add(`visible`)
        resetControlButton.classList.add(`visible`)

        setTimeout(()=>
        {
            if(isMobile({tablet: true})){}
            else
            {
                poiButton.classList.add(`trans-width`)
                playButton.classList.add(`trans-width`)
                stopButton.classList.add(`trans-width`)
                backMenuButton.classList.add(`trans-width`)
                resetControlButton.classList.add(`trans-width`)
            }
        }, 1350)
    }, 1500)
}

const menuScreen = () => 
{
    gsap.fromTo(`.text1`, {opacity: 0}, {opacity: 1, duration: 2})
    gsap.fromTo(`.text1`, {y: -500}, {y: 0, duration: 2})
    gsap.fromTo(`.text2`, {opacity: 0}, {opacity: 1, duration: 2})
    gsap.fromTo(`.text2`, {y: 500}, {y: 0, duration: 2})
    gsap.fromTo(uniforms.transition2Value, {value: 1.0}, {value: 0.23, duration: 3})
    resetCameraPOI()
    autoHideText[3].textContent = ``
    poiButton.classList.remove(`trans-width`)
    playButton.classList.remove(`trans-width`)
    stopButton.classList.remove(`trans-width`)
    backMenuButton.classList.remove(`trans-width`)
    resetControlButton.classList.remove(`trans-width`)
    backMenuButton.classList.remove(`visible`)
    poiButton.classList.remove(`visible`)
    playButton.classList.remove(`visible`)
    stopButton.classList.remove(`visible`)
    resetControlButton.classList.remove(`visible`)
    wrapper.style.zIndex = `0`
    resetExploreMenu()
    setTimeout(()=>{autoHideText[3].textContent = `Menu`}, 500)
}

const enableControl = {
    exploreMode: () => 
    {
        clearScreen()
        exploreMenu()
        gsap.fromTo(camera.position, {x: -50, y: 17, z: 82}, {x: -15, y: 8, z: 21, duration: 2, ease: `circ.out`})
        explore = true
        control.enabled = true
        control.target.set(0,0,0)
    },

    autoPlayMode: () => 
    {
        pausingTween()
        menuScreen()
        clearingTimeout()
        cinTween[2].play(0)
        points.forEach((point) => {point.element.classList.remove(`visible`)})
        changeIcon[0].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:eye-off"></span>`
        changeIcon[1].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:play"></span>`
        gsap.fromTo(camera.position, {x: -15, y: 8, z: 21}, {x: -50, y: 17, z: 82, duration: 2, ease: `circ.out`})
        explore = false
        control.enabled = false
        camera.lookAt(0,0,0)
        sceneMusic.stop()
    }
}

// * HTML
const startButton = document.querySelector(`.start-btn`)
const exploreButton = document.querySelector(`.explore-btn`)
const aboutButton = document.querySelector(`.about-btn`)
const backMenuButton = document.querySelector(`.back-btn`)
const poiButton = document.querySelector(`.poi-btn`)
const playButton = document.querySelector(`.play-btn`)
const stopButton = document.querySelector(`.stop-btn`)
const resetControlButton = document.querySelector(`.reset-btn`)
const autoHideText = document.querySelectorAll(`.hide-txt`)
const changeIcon = document.querySelectorAll(`.icon-change`)
const aboutContainer = document.querySelector(`.about-container`)
const closeAboutButton = document.querySelector(`.close-btn`)
const idTranslateButton = document.querySelector(`.flag-id`)
const enTranslateButton = document.querySelector(`.flag-us`)
const aboutText = document.querySelector(`.about-txt`)
const githubLinkButton = document.querySelector(`.github`)
const twitterLinkButton = document.querySelector(`.twitter`)
const scLinkButton = document.querySelector(`.soundcloud`)
const uiHelper = document.querySelector(`.helper-container`)
const uiHelperButton = document.querySelector(`.help-btn`)
const uiHelperCloseButton = document.querySelector(`.helper-close-btn`)
let hidePOI = false
let musicPlay = false
let showUIHelper = false

uiHelperButton.addEventListener(`click`, ()=>
{
    if(showUIHelper === false)
    {
        uiHelper.classList.add(`visible`)
        showUIHelper = true
    }
    else if(showUIHelper === true)
    {
        uiHelper.classList.remove(`visible`)
        showUIHelper = false
    }
})

uiHelperCloseButton.addEventListener(`click`, ()=>
{
    uiHelper.classList.remove(`visible`)
    showUIHelper = false
})

startButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.start-text`, {scale: 2, duration: 0.5})
})

startButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.start-text`, {scale: 1, duration: 0.5})
})

exploreButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.explore-text`, {scale: 2, duration: 0.5})
})

exploreButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.explore-text`, {scale: 1, duration: 0.5})
})

aboutButton.addEventListener(`mouseover`, ()=>
{
    gsap.to(`.about-text`, {scale: 2, duration: 0.5})
})

aboutButton.addEventListener(`mouseout`, ()=>
{
    gsap.to(`.about-text`, {scale: 1, duration: 0.5})
})

aboutButton.addEventListener(`click`, ()=>
{
    aboutContainer.classList.add(`visible`)
    setTimeout(()=>
    {   
        gsap.to(`.about-txt`, {opacity: 1, duration: 2.5, ease: `power2.out`})
        gsap.fromTo(`.about-txt`, {y: 50}, {y: 0, duration: 1, ease: `power2.out`})

        gsap.fromTo(`.tool-icon`, {y: 50}, {y: 0, duration: 0.3, stagger: 0.1, ease: `power2.out`})
        gsap.to(`.tool-icon`, {opacity: 1, duration: 0.3, stagger: 0.1, ease: `power2.out`})
        
        gsap.fromTo(`.social-icon`, {y: 50}, {y: 0, duration: 0.3, stagger: 0.1, ease: `power2.out`})
        gsap.to(`.social-icon`, {opacity: 1, duration: 0.3, stagger: 0.1, ease: `power2.out`})
    },500)
})

closeAboutButton.addEventListener(`click`, ()=>
{
    aboutContainer.classList.remove(`visible`)
    gsap.to(`.about-txt`, {opacity: 0, duration: 1})
    gsap.fromTo(`.about-txt`, {y: 0}, {y: 50, duration: 1})
    
    gsap.fromTo(`.tool-icon`, {y: 0}, {y: 50, duration: 0.3})
    gsap.to(`.tool-icon`, {opacity: 0, duration: 0.3})

    gsap.fromTo(`.social-icon`, {y: 0}, {y: 50, duration: 0.3})
    gsap.to(`.social-icon`, {opacity: 0, duration: 0.3})
})

idTranslateButton.addEventListener(`click`, ()=>
{
    document.querySelector(`.about-title`).textContent = `Tentang`
    aboutText.textContent = `
    Hai, saya Achmat Fauzi, pengembang di balik aplikasi web ini menyambut Anda.
    Mengapa saya membuat situs ini? Nah, saat itu saya mendapat ide nostalgia 
    ketika saya melihat taman bermain di dekat rumah. Kemudian Saya berpikir,
    "Bagaimana jika saya membuat rekreasi digital tentang bermain atau bersantai 
    di taman bermain yang membuat orang merasa nostalgia dan damai?", maka saya 
    membuat aplikasi web sederhana ini. 
    `

    gsap.fromTo(`.about-txt`, {opacity: 0}, {opacity: 1, duration: 2.5, ease: `power2.out`})
    gsap.fromTo(`.about-txt`, {y: 50}, {y: 0, duration: 1, ease: `power2.out`})
})

enTranslateButton.addEventListener(`click`, ()=>
{
    document.querySelector(`.about-title`).textContent = `About`
    aboutText.textContent = `
    Hi, I'm Achmat Fauzi, the developer behind this web application welcoming you. 
    Why did I make this website? Well, back then I come to the idea of nostalgia when 
    I look at the playground near my home. Then I thought, "what if I create digital recreation
    about playing or chilling at a playground that makes people feel nostalgic and peaceful?", 
    so I make this web application.
    `

    gsap.fromTo(`.about-txt`, {opacity: 0}, {opacity: 1, duration: 2.5, ease: `power2.out`})
    gsap.fromTo(`.about-txt`, {y: 50}, {y: 0, duration: 1, ease: `power2.out`})
})

githubLinkButton.addEventListener(`click`, ()=>
{
    window.open(`https://github.com/ymmycode`, `_blank`).focus()
})

twitterLinkButton.addEventListener(`click`, ()=>
{
    window.open(`https://twitter.com/mstrdp`, `_blank`).focus()
})

scLinkButton.addEventListener(`click`, ()=>
{
    window.open(`https://soundcloud.com/mstrdp`, `_blank`).focus()
})

startButton.addEventListener(`click`, ()=>
{
    backMenuButton.classList.add(`visible`)
    setTimeout(()=>{!isMobile({tablet: true}) && backMenuButton.classList.add(`trans-width`)}, 1350)
    clearScreen()
    sceneMusic.play() 
    cinematic()
})

exploreButton.addEventListener(`click`, enableControl.exploreMode)

backMenuButton.addEventListener(`mouseover`, ()=>
{
    !isMobile({tablet: true}) && autoHideText[3].classList.add(`visible`)
})

backMenuButton.addEventListener(`mouseout`, ()=>
{
    autoHideText[3].classList.remove(`visible`)
})

backMenuButton.addEventListener(`click`, enableControl.autoPlayMode)

poiButton.addEventListener(`click`, ()=> 
{
    if(hidePOI === false) 
    {
        changeIcon[0].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:eye"></span>`
        autoHideText[0].textContent = `Show`
        hideAllPOI()
        hidePOI = true
    }
    else if(hidePOI === true) 
    {
        changeIcon[0].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:eye-off"></span>`
        autoHideText[0].textContent = `Hide`
        showAllPOI()
        hidePOI = false
    }
})

playButton.addEventListener(`click`, ()=> 
{
    if(musicPlay === false) 
    {
        changeIcon[1].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:pause"></span>`
        autoHideText[1].textContent = `Pause`
        sceneMusic.play()
        sceneMusic.setLoop(true)
        musicPlay = true
    }
    else if(musicPlay === true) 
    {
        changeIcon[1].innerHTML = 
        `<span class="iconify-inline noselect" data-icon="ion:play"></span>`
        autoHideText[1].textContent = `Play`
        sceneMusic.pause()
        musicPlay = false
    }
})

poiButton.addEventListener(`mouseover`, ()=>
{
    !isMobile({tablet: true}) && autoHideText[0].classList.add(`visible`)
})

poiButton.addEventListener(`mouseout`, ()=>
{
    autoHideText[0].classList.remove(`visible`)
})

playButton.addEventListener(`mouseover`, ()=>
{
    !isMobile({tablet: true}) && autoHideText[1].classList.add(`visible`)
})

playButton.addEventListener(`mouseout`, ()=>
{
    autoHideText[1].classList.remove(`visible`)
})

stopButton.addEventListener(`mouseover`, ()=>
{
    !isMobile({tablet: true}) && autoHideText[2].classList.add(`visible`)
})

stopButton.addEventListener(`mouseout`, ()=>
{
    autoHideText[2].classList.remove(`visible`)
})

stopButton.addEventListener(`click`, ()=> 
{
    changeIcon[1].innerHTML = 
    `<span class="iconify-inline noselect" data-icon="fa-solid:play"></span>`
    autoHideText[1].textContent = `Play`
    musicPlay = false
    sceneMusic.setLoop(false)
    sceneMusic.stop()
})

resetControlButton.addEventListener(`mouseover`, ()=>
{
    !isMobile({tablet: true}) && autoHideText[4].classList.add(`visible`)
})

resetControlButton.addEventListener(`mouseout`, ()=>
{
    autoHideText[4].classList.remove(`visible`)
})

resetControlButton.addEventListener(`click`, ()=> 
{
    resetCameraPOI()
    gsap.to(camera.position, {x: -15, y: 8, z: 21, duration: 1, ease: `circ.out`})
    gsap.to(control.target, {x: 0, y: 0, z: 0, duration: 1})
})

// * HTML POI
const resetCameraPOI =  () => 
{
    swing = false
    camera.fov = 45
    camera.near = 0.01
    camera.updateProjectionMatrix()
}

const clipActive = ()=>
{
    swing = false
    camera.fov = 45
    camera.near = 1
    camera.updateProjectionMatrix()
}

points[0].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[0].position.x, y: points[0].position.y + 0.1, z: points[0].position.z, duration: 2})
        gsap.to(control.target, {x: points[0].position.x - .7, y: points[0].position.y + 0.2, z: points[0].position.z + .3, duration: 2})
        swing === true && clipActive()
    }
)

points[1].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[1].position.x, y: points[1].position.y , z: points[1].position.z, duration: 2})
        gsap.to(control.target, {x: points[1].position.x - 0.2, y: points[1].position.y - 0.8, z: points[1].position.z + 1, duration: 2})
        clipActive()
        swing === true && clipActive()
    }
)

points[2].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[2].position.x, y: points[2].position.y + 0.2 , z: points[2].position.z, duration: 2})
        gsap.to(control.target, {x: points[2].position.x + 0.1, y: points[2].position.y - 0.1, z: points[2].position.z , duration: 2})
        clipActive()
        swing === true && clipActive()
    }
)

points[3].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[3].position.x, y: points[3].position.y , z: points[3].position.z, duration: 2})
        gsap.to(control.target, {x: points[3].position.x + 0.03, y: points[3].position.y - 0.01, z: points[3].position.z - 0.05 , duration: 2})
        clipActive()
        swing === true && clipActive()
    }
)

points[4].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[4].position.x, y: points[4].position.y , z: points[4].position.z, duration: 2})
        gsap.to(control.target, {x: points[4].position.x + 0.01 , y: points[4].position.y - 0.02 , z: points[4].position.z + 0.14 , duration: 2})
        clipActive()
        swing === true && clipActive()
    }
)

points[5].element.addEventListener(`click`,
    () => 
    {
        gsap.to(camera.position, {x: points[5].position.x, y: points[5].position.y , z: points[5].position.z, duration: 2})
        gsap.to(control.target, {x: points[5].position.x + 0.2 , y: points[5].position.y - 0.02 , z: points[5].position.z + 0.14 , duration: 2})
        clipActive()
    
        setTimeout(
            ()=> 
            {
                swing = true
            }, 2000
        )
    }
)

// TODO modal window for about

// * FULLSCREEN
const fullscreenButton = document.querySelector(`.screen-icon`)

const toggleForceLandscapeFullscreen = ()=> 
{
    const doc = window.document
    const docEl = doc.documentElement

    let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen
    let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen

    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl)
        isMobile({tablet: true}) && screen.orientation.lock(`landscape`)
    }
    else {
        isMobile({tablet: true}) && screen.orientation.unlock()
        cancelFullScreen.call(doc)
    }
}

fullscreenButton.addEventListener(`click`, toggleForceLandscapeFullscreen)

// * DEBUG
// ! remove comment
// const cameraConfig = gui.addFolder(`camera config`)
// cameraConfig.open()

// cameraConfig
// .add(uniforms.transitionValue, `value`).name(`transition value`)
// .min(0).max(1.5).step(0.001)

// cameraConfig
// .add(uniforms.transition2Value, `value`).name(`transition 2 value`)
// .min(0).max(1).step(0.001)

// cameraConfig
// .add(camera.position, `x`).name(`camera x`)
// .min(-100).max(100).step(0.001)

// cameraConfig
// .add(camera.position, `y`).name(`camera y`)
// .min(-100).max(100).step(0.001)

// cameraConfig
// .add(camera.position, `z`).name(`camera z`)
// .min(-100).max(100).step(0.001)

// cameraConfig
// .add(point.position, `x`).name(`look point x`)
// .min(-20).max(20).step(0.001)

// cameraConfig
// .add(point.position, `y`).name(`look point y`)
// .min(-20).max(20).step(0.001)

// cameraConfig
// .add(point.position, `z`).name(`look point z`)
// .min(-20).max(20).step(0.001)

// cameraConfig
// .add(control.target, `x`).name(`target point x`)
// .min(-20).max(20).step(0.001)

// cameraConfig
// .add(control.target, `y`).name(`target point y`)
// .min(-20).max(20).step(0.001)

// cameraConfig
// .add(control.target, `z`).name(`target point z`)
// .min(-20).max(20).step(0.001)

// const lightConfig = gui.addFolder(`light Config`)

// lightConfig
// .add(configParam, `animationSpeed`).name(`Animation Speed`)
// .min(0.1).max(3).step(0.001)

// lightConfig
// .add(ambientLight, `intensity`).name(`Ambient Light Intensity`)
// .min(0.1).max(3).step(0.001)

// lightConfig
// .add(sunLight, `intensity`).name(`Sun Light Intensity`)
// .min(0.1).max(3).step(0.001)

// lightConfig
// .add(bloomPass, `strength`).name(`Bloom Strength`)
// .min(0).max(1).step(0.001)

// const folder = gui.addFolder('FilmPass')
// folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale')
// folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity')
// folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity')
// folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count')

// gui.hide()