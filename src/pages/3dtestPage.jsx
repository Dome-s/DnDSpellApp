import { useEffect, useRef } from 'react';
import * as THREE from 'three/webgpu';
import {
  color,
  float,
  int,
  materialReference,
  mrt,
  normalView,
  output,
  packNormalToRGB,
  pass,
  roughness,
  sample,
  uniform,
  unpackRGBToNormal,
  vec2,
} from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js';
import { bilateralBlur } from 'three/addons/tsl/display/BilateralBlurNode.js';
import { depthAwareBlend } from 'three/addons/tsl/display/depthAwareBlend.js';
import { godrays } from 'three/addons/tsl/display/GodraysNode.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';   
import { ssr } from 'three/addons/tsl/display/SSRNode.js';
import './3dtestPage.css';

const LIGHTMAP_CONFIG = [
  {
    key: 'walls',
    keywords: ['wall'],
    file: 'Lightmap_walls.png',
  },
  {
    key: 'floors',
    keywords: ['floor'],
    file: 'Lightmap_floors.png',
  },
  {
    key: 'columns',
    keywords: ['column', 'collum'],
    file: 'Lightmap_columns.png',
  },
  {
    key: 'windows',
    keywords: ['window'],
    file: 'Lightmap_windows.png',
  },
  {
    key: 'planes',
    keywords: ['plane'],
    file: 'Lightmap_planes.png',
  },
];

// Repeated castle sections are spaced along this vector. Keeping movement and
// recycling derived from the same vector prevents gaps accumulating over time.
const MODEL_TILE_OFFSET = new THREE.Vector3(-53, 0, -53);
const MODEL_TILE_SCALES = [1, 1.002, 0.998];
const CAMERA_MOVE_DIRECTION = MODEL_TILE_OFFSET.clone().normalize();
const CAMERA_MOVE_SPEED = 1.125;
const CAMERA_LOOP_DISTANCE = MODEL_TILE_OFFSET.length();
const CAMERA_LOOP_BLEND_DURATION = 0.25;
const CAMERA_LOOP_BLEND_DAMPING = 0.9;


function getLightmapGroup(objectName) {

  if (!objectName) return null;

  const name = objectName.toLowerCase();

  for (const config of LIGHTMAP_CONFIG) {

    if (
      config.keywords.some(
        keyword => name.includes(keyword)
      )
    ) {
      return config.key;
    }
  }

  return null;
}

function resolveLightmapGroup(object, materials) {

  let currentObject = object;

  while (currentObject) {
    const group = getLightmapGroup(currentObject.name);
    if (group) return group;
    currentObject = currentObject.parent;
  }

  for (const material of materials) {
    const group = getLightmapGroup(material.name);
    if (group) return group;
  }

  return null;
}

function disposeObject(root) {
  root.traverse((object) => {
    object.geometry?.dispose();

    const materials = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];

    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

export default function ThreeDTestPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let isDisposed = false;
    let rendererInitialized = false;
    let modelReady = false;
    let renderingStarted = false;
    let initializationTimerId;
    let environmentRenderTarget;
    const roots = [];

    const renderer = new THREE.WebGPURenderer({ antialias: true, canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 1000);
    camera.position.set(-5, 1.5, -10);
    camera.lookAt(-6, 1.5, -11);
    //camera.position.set(3, 1.5, -2);

    const animationClock = new THREE.Clock(false);
    const cameraMoveDirection = new THREE.Vector3();
    const cameraMoveOffset = new THREE.Vector3();
    let cameraDistanceTravelled = 0;
    let loopBlendTimeRemaining = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#defeff');

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.01);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.04;
    sunLight.shadow.autoUpdate = false;
    sunLight.shadow.needsUpdate = true;
    scene.add(sunLight, sunLight.target);

    const renderPipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);

    scenePass.setMRT(mrt({
      output,
      normal: packNormalToRGB(normalView),
      // Keep SSR reflectivity independent from physically-correct material
      // metalness. In Three r185, mirror-path SSR multiplies its result by
      // `metalnessNode`, even when `reflectNonMetals` is enabled.
      ssrSurface: vec2(
        materialReference('userData.ssrStrength', 'float'),
        roughness,
      ),
    }));

    const scenePassColor = scenePass.getTextureNode('output');
    const scenePassDepth = scenePass.getTextureNode('depth');
    const scenePassNormal = scenePass.getTextureNode('normal');
    const scenePassSSRSurface = scenePass.getTextureNode('ssrSurface');

    // Normals and metalness/roughness do not need half-float MRT storage.
    scenePass.getTexture('normal').type = THREE.UnsignedByteType;
    scenePass.getTexture('ssrSurface').type = THREE.UnsignedByteType;

    const sceneNormal = sample((uvNode) => (
      unpackRGBToNormal(scenePassNormal.sample(uvNode))
    ));

    const ssrPass = ssr(scenePassColor, scenePassDepth, sceneNormal, {
      metalnessNode: scenePassSSRSurface.r,
      roughnessNode: scenePassSSRSurface.g,
      reflectNonMetals: true,
      binaryRefine: true,
    });
    ssrPass.resolutionScale = 1.0;
    ssrPass.quality.value = 1.0;
    ssrPass.blurQuality = 2;

    ssrPass.maxDistance.value = 50;
    ssrPass.thickness.value = 0.2;
    ssrPass.intensity.value = 0.8;
    ssrPass.screenEdgeFade.value = 0.05;
    ssrPass.screenEdgeFadeBlack = true;

    const godraysPass = godrays(scenePassDepth, camera, sunLight);
    godraysPass.raymarchSteps.value = 48;
    godraysPass.density.value = 0.15;
    godraysPass.maxDensity.value = 0.15;
    godraysPass.distanceAttenuation.value = 0.8;
    godraysPass.resolutionScale = 0.8;

    const blurPass = bilateralBlur(godraysPass.getTextureNode());
    const godrayColor = uniform(color(0xffffff));
    const edgeRadius = uniform(int(2));
    const edgeStrength = uniform(float(2));

    const sceneWithGodrays = depthAwareBlend(
      scenePassColor,
      blurPass.getTextureNode(),
      scenePassDepth,
      camera,
      {
        blendColor: godrayColor,
        edgeRadius,
        edgeStrength,
      },
    );

    // SSR outputs premultiplied reflection color, so it is composited additively.
    const finalScene = sceneWithGodrays.add(ssrPass.rgb);                                                                                  
                                                                                                                                         
    const focusDistance = uniform(10);                                                                                                     
    const focusRange = uniform(15);                                                                                                         
    const bokehScale = uniform(2);                                                                                                         
                                                                                                                                          
    const dofPass = dof(                                                                                                                   
      finalScene,                                                                                                                          
      scenePass.getViewZNode(),                                                                                                            
      focusDistance,                                                                                                                       
      focusRange,                                                                                                                          
      bokehScale,                                                                                                                          
    );                                                                                                                                     
                                                                                                                                          
    const loopBlendDamp = uniform(0);                                                                                                      
    const loopBlendPass = afterImage(dofPass, loopBlendDamp);                                                                              
                                                                                                                                          
    renderPipeline.outputNode = loopBlendPass;   
    function configureShadows(box, boxCenter) {
      const boxDimensions = box.getSize(new THREE.Vector3());
      const largestDimension = Math.max(
        boxDimensions.x,
        boxDimensions.y,
        boxDimensions.z,
      );

      const pos = new THREE.Vector3(-60,5,-155);
      sunLight.position.set(pos.x, pos.y, pos.z);

      sunLight.target.position.copy(boxCenter);
      sunLight.target.updateMatrixWorld();

      const shadowCamera = sunLight.shadow.camera;
      const shadowExtent = largestDimension * .8;
      shadowCamera.near = 0.1;
      shadowCamera.far = largestDimension * 5;
      shadowCamera.left = -shadowExtent;
      shadowCamera.right = shadowExtent;
      shadowCamera.top = shadowExtent;
      shadowCamera.bottom = -shadowExtent;
      shadowCamera.updateProjectionMatrix();
    }

    function setupEnvironment() {
      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);

      environmentRenderTarget = pmremGenerator.fromScene(environment, 0.04);
      scene.environment = environmentRenderTarget.texture;
      scene.environmentIntensity = 0.02;

      environment.dispose();
      pmremGenerator.dispose();
    }

    // AddLights(); // Optional interior point lights; disabled for the sun pass.

    const modelUrl = `${import.meta.env.BASE_URL}models/Castle2.glb`;
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    async function loadSceneAssets() {
      const lightMaps = {};

      try {
        const lightMapsPromise = Promise.all(
          LIGHTMAP_CONFIG.map(async (config) => {
            const texture = await textureLoader.loadAsync(
              `${import.meta.env.BASE_URL}models/${config.file}`,
            );

            texture.channel = 1;
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            lightMaps[config.key] = texture;
          }),
        );

        const modelPromise = gltfLoader.loadAsync(modelUrl, (event) => {
          if (event.total) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            console.log(`Castle loading: ${percentage}%`);
          }
        });

        const [, gltf] = await Promise.all([lightMapsPromise, modelPromise]);

        if (isDisposed) {
          Object.values(lightMaps).forEach((texture) => texture.dispose());
          disposeObject(gltf.scene);
          return;
        }

        const root = gltf.scene;
        root.traverse((object) => {
          if (!object.isMesh) return;

          const originalMaterials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          // Every rendered material needs a defined value for the MRT's
          // materialReference. Floor clones override this below.
          originalMaterials.forEach((material) => {
            material.userData.ssrStrength = 0;
          });

          const isInvisibleWindowPane = originalMaterials.some((material) => (
            /^Window(?:\.\d+)?$/i.test(material.name)
            && material.opacity === 0
          ));

          if (isInvisibleWindowPane) {
            object.visible = false;
            object.castShadow = false;
            object.receiveShadow = false;
            return;
          }

          object.castShadow = true;
          object.receiveShadow = true;

          if (!object.geometry.hasAttribute('uv1')) {
            console.warn('Missing uv1:', object.name);
            return;
          }

          const group = resolveLightmapGroup(object, originalMaterials);
          const lightMap = lightMaps[group];

          if (!lightMap) {
            console.warn(
              'Missing lightmap:',
              object.name,
              originalMaterials.map((material) => material.name),
              group,
            );
            return;
          }

          const createLightmappedMaterial = (originalMaterial) => {

          // ========================================================
          // FLOOR -> convert safely to MeshPhysicalMaterial
          // ========================================================

          if (
            group === 'floors'
            && (
              originalMaterial.isMeshStandardMaterial
              || originalMaterial.isMeshPhysicalMaterial
            )
          ) {

            const material = new THREE.MeshPhysicalMaterial({

              // Base appearance
              color: originalMaterial.color,
              map: originalMaterial.map,

              // PBR maps
              normalMap: originalMaterial.normalMap,
              roughnessMap: originalMaterial.roughnessMap,
              metalnessMap: originalMaterial.metalnessMap,

              // Other imported maps
              aoMap: originalMaterial.aoMap,
              emissiveMap: originalMaterial.emissiveMap,
              alphaMap: originalMaterial.alphaMap,

              // Basic material settings
              transparent: originalMaterial.transparent,
              opacity: originalMaterial.opacity,
              side: originalMaterial.side,
              alphaTest: originalMaterial.alphaTest,
              vertexColors: originalMaterial.vertexColors,

              // Floor PBR
              metalness: 0,
              roughness: 0.12,

              // Polished surface
              clearcoat: 1.0,
              clearcoatRoughness: 0,

              ior: 1.5,
              specularIntensity: 1.0,

              // Baked lighting
              lightMap,
              lightMapIntensity: 1,
            });


            // Preserve normal-map strength
            if (
              originalMaterial.normalScale
              && material.normalScale
            ) {
              material.normalScale.copy(
                originalMaterial.normalScale
              );
            }


            // Preserve AO strength
            if (
              originalMaterial.aoMapIntensity !== undefined
            ) {
              material.aoMapIntensity =
                originalMaterial.aoMapIntensity;
            }


            // Preserve emissive properties
            if (originalMaterial.emissive) {
              material.emissive.copy(
                originalMaterial.emissive
              );
            }

            if (
              originalMaterial.emissiveIntensity
              !== undefined
            ) {
              material.emissiveIntensity =
                originalMaterial.emissiveIntensity;
            }


            material.name =
              `${originalMaterial.name}_PhysicalFloor`;

            material.userData.ssrStrength = 0.2;

            material.needsUpdate = true;

            return material;
          }


          // ========================================================
          // EVERYTHING ELSE
          // ========================================================

          const material = originalMaterial.clone();
          if (group === 'floors') {
            material.metalness = 0;
            material.roughness = 0.25;
            material.userData.ssrStrength = 0.4;
          }
          if (
            material.isMeshStandardMaterial
            || material.isMeshPhysicalMaterial
          ) {

            material.lightMap = lightMap;
            material.lightMapIntensity = 1;

            material.needsUpdate = true;
          }
          if(group === 'walls' || group === 'columns' || group === 'windows') {
            material.userData.ssrStrength = 0.1;
          }

          return material;
        };

          object.material = Array.isArray(object.material)
            ? object.material.map(createLightmappedMaterial)
            : createLightmappedMaterial(object.material);

          console.log(`${object.name} -> ${group}`);
        });
        // Clone only the Object3D hierarchy. Geometry, materials and textures
        // remain shared, so the additional tiles require no downloads, texture
        // uploads or shader compilation. Tiny scale differences separate
        // overlapping surfaces enough to avoid visible z-fighting.
        const tileRoots = [root, root.clone(true), root.clone(true)];

        tileRoots.forEach((tileRoot, index) => {
          tileRoot.position.copy(MODEL_TILE_OFFSET).multiplyScalar(index);
          tileRoot.scale.multiplyScalar(MODEL_TILE_SCALES[index]);
        });

        roots.push(...tileRoots);
        scene.add(...tileRoots);

        const box = new THREE.Box3().setFromObject(root);
        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());

        configureShadows(box, boxCenter);
        sunLight.shadow.needsUpdate = true;


        cameraDistanceTravelled = 0;

        modelReady = true;
        startRenderingWhenReady();
      } catch (error) {
        Object.values(lightMaps).forEach((texture) => texture.dispose());
        if (!isDisposed) console.error('Castle assets failed to load:', error);
      }
    }

    function resizeRendererToDisplaySize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const pixelRatio = renderer.getPixelRatio();
      const needsResize = (
        canvas.width !== Math.floor(width * pixelRatio)
        || canvas.height !== Math.floor(height * pixelRatio)
      );

      if (needsResize && width > 0 && height > 0) {
        renderer.setSize(width, height, false);
      }

      return needsResize;
    }

    function render() {
      if (resizeRendererToDisplaySize()) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      const deltaSeconds = Math.min(animationClock.getDelta(), 0.1);

      cameraMoveDirection.copy(CAMERA_MOVE_DIRECTION);

      if (cameraMoveDirection.lengthSq() > 0.000001) {
        cameraMoveDirection.normalize();
        cameraMoveOffset.copy(cameraMoveDirection).multiplyScalar(
          CAMERA_MOVE_SPEED * deltaSeconds,
        );

        // Translate the target with the camera to preserve the viewing angle.
        camera.position.add(cameraMoveOffset);
        cameraDistanceTravelled += cameraMoveOffset.length();

        while (cameraDistanceTravelled >= CAMERA_LOOP_DISTANCE) {
          // Rebase the camera and every tile by the same amount. Their relative
          // positions do not change, so there is no visible camera cut and
          // coordinates stay close to the origin indefinitely.
          camera.position.sub(MODEL_TILE_OFFSET);
          roots.forEach((root) => root.position.sub(MODEL_TILE_OFFSET));

          // Move the tile now behind the camera one slot ahead. It already
          // shares all GPU resources with the other tiles. Its fixed scale
          // travels with it, producing a three-section repeating pattern.
          const recycledRoot = roots.shift();
          const leadingRoot = roots[roots.length - 1];
          recycledRoot.position.copy(leadingRoot.position).add(MODEL_TILE_OFFSET);
          roots.push(recycledRoot);

          cameraDistanceTravelled -= CAMERA_LOOP_DISTANCE;
          loopBlendTimeRemaining = CAMERA_LOOP_BLEND_DURATION;
        }
      }

      if (loopBlendTimeRemaining > 0) {
        loopBlendDamp.value = CAMERA_LOOP_BLEND_DAMPING * (
          loopBlendTimeRemaining / CAMERA_LOOP_BLEND_DURATION
        );
        loopBlendTimeRemaining = Math.max(
          0,
          loopBlendTimeRemaining - deltaSeconds,
        );
      } else {
        loopBlendDamp.value = 0;
      }

      renderPipeline.render();
    }

    function startRenderingWhenReady() {
      if (
        isDisposed
        || !rendererInitialized
        || !modelReady
        || renderingStarted
      ) return;

      // GodraysNode reads the light's shadow depth texture while its shader is
      // being built. WebGPURenderer creates that texture lazily during a scene
      // render, so prime the shadow pass before compiling the post-processing
      // pipeline.
      renderer.render(scene, camera);

      if (!sunLight.shadow.map?.depthTexture) {
        console.error('Godrays could not start because the sun shadow map was not created.');
        return;
      }

      renderingStarted = true;
      animationClock.start();
      renderer.setAnimationLoop(render);
    }

    initializationTimerId = window.setTimeout(() => {
      renderer.init()
        .then(() => {
          rendererInitialized = true;

          if (isDisposed) {
            renderer.dispose();
            return;
          }

          setupEnvironment();
          loadSceneAssets();

        })
        .catch((error) => {
          if (!isDisposed) console.error('WebGPU renderer failed to initialize:', error);
        });
    }, 0);

    return () => {
      isDisposed = true;
      window.clearTimeout(initializationTimerId);
      animationClock.stop();
      disposeObject(scene);
      godraysPass.dispose();
      blurPass.dispose();
      ssrPass.dispose();
      loopBlendPass.dispose();
      renderPipeline.dispose();
      scene.environment = null;
      environmentRenderTarget?.dispose();

      if (!rendererInitialized) return;

      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []);

  return (
    <main className="three-d-test-page">
      <header className="corridor-headline">
        <p>Three.js / in Browser .obj Rendering</p>
        <h1>Infinite Hallway</h1>
      </header>
      <canvas ref={canvasRef} className="three-canvas-container" />
    </main>
  );
}
