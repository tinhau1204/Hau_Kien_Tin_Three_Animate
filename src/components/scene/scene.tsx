"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from "three/examples/jsm/Addons.js";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as dat from "dat.gui"; //adding panel to interactive with model 
import Panel from "../panel/panel";
import styles from "./page.module.css"

declare global {
  interface Window {
    time: number;
  }
}

function setup(
  containerElement: HTMLElement,
  setIsPanelVisible: (visible: boolean) => void,
  setPanelDetails: ({ materialName }: panelDetailsData) => void
) {
  if (containerElement.children.length > 0) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  containerElement.appendChild(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  camera.position.set(-10, 10, 20);
  orbit.update();

  //load model by GLTF file
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  //run model animation
  let mixer: THREE.AnimationMixer
  let mixerClip: THREE.AnimationAction;
  let modelIsReady = false;
  const clock = new THREE.Clock()

  //Gui control
  const gui = new dat.GUI();
  const options = {
    staticPose: false,
    speed: 1,
    pause: false,
    animation: true,

  }

  dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
  loader.setDRACOLoader(dracoLoader);
  loader.load('/dielsAlderRegiochemistry/scene.gltf', (gltfScene) => {
    mixer = new THREE.AnimationMixer(gltfScene.scene)
    const clips = gltfScene.animations;
    // Play all animations
    clips.forEach(function (clip) {
      mixerClip = mixer.clipAction(clip)
      mixerClip.play(); // Start playing the animation

      gui.add(options, 'pause').onChange(function (e) {
        mixer.clipAction(clip).paused = e;
      })

      gui.add(options, 'speed',
        {
          "0.5x": 0.5,
          "1.0x": 1,
          "1.5x": 1.5,
          "2.0x": 2
        }).onChange(function (e) {
          mixer.clipAction(clip).timeScale = e;
        });

      gui.add(options, 'staticPose').onChange(function (e) {
        if (!e) {
          mixer.clipAction(clip).play() //run animation
        } else {
          mixer.clipAction(clip).stop() //staticPose
        }
      })
    });
    scene.add(gltfScene.scene)

    // Set initial position and scale if needed
    gltfScene.scene.position.set(0, 0, 0);
    gltfScene.scene.scale.set(1, 1, 1);
    modelIsReady = true;
  })

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Adjust intensity as needed
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
  scene.add(directionalLight)
  directionalLight.position.set(0, 50, 20);
  directionalLight.target.position.set(0, 0, 0);
  scene.add(directionalLight.target);
  directionalLight.castShadow = true;

  scene.background = new THREE.Color(0xFFFFFF);

  const stats = new Stats()
  document.body.appendChild(stats.dom)

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  Object.defineProperty(window, 'time', {
    get: function () {
      return mixerClip ? mixerClip.time : 0;
    }
  });

  // Event listener for click to detect intersections and highlight
  window.addEventListener('click', (event) => {
    // Set the raycaster based on the pointer position
    const canvasBounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y = - ((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    // Calculate objects intersecting the raycaster
    const intersects = raycaster.intersectObjects(scene.children, true);

    function modalMaterial(materialName: string, modelStage: string | undefined) {

      let stage;
      if (modelStage === undefined) {
        let durationDetail = `This is a table of the levels of protection class.`;
        setPanelDetails({ materialName, durationDetail });
        setIsPanelVisible(true)
        return;
      }

      if (parseInt(modelStage as string) > 7) {
        stage = parseInt(modelStage as string) - 7
        const getOrdinalSuffix = (num: number): string => {
          if (num === 1) return "first";
          if (num === 2) return "second";
          if (num === 3) return "third";
          return `${num}th`;
        };

        let durationDetail = `this is the ${getOrdinalSuffix(stage)} stage of diels alder regiochemistry reaction process.`;

        setPanelDetails({ materialName, durationDetail });
        setIsPanelVisible(true)
      } else if (parseInt(modelStage as string) === 7) {
        setIsPanelVisible(true)
        return;
      } else {
        stage = parseInt(modelStage as string)
        let durationDetail = "";
        switch (stage) {
          case 1:
            durationDetail = `This is the protective layer part of the diels rich in alder`;
          case 2:
            durationDetail = `This is the protective layer part of the diels poor in alder`
          case 3:
            durationDetail = `This is the protective layer part of both alders linked`
        }
        setPanelDetails({ materialName, durationDetail });
        setIsPanelVisible(true)
      }
    }
    // Check if there’s an intersection
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object as THREE.Mesh;
      const intersectionPoint = intersects[0].point;
      let materialName = (intersectedObject.material as THREE.MeshStandardMaterial).name.split("_");
      //window time get the time of the animation running.
      console.log("Current animation time on click: ", window.time);
      if (materialName[0] == 'material') {
        if ((parseInt(materialName[1]) > 0 && parseInt(materialName[1]) < 4)) {
          switch (parseInt(materialName[1])) {
            case 1:
            case 2:
            case 3:
              modalMaterial((intersectedObject.material as THREE.MeshStandardMaterial).name, materialName[1])
            default:
          }
        } else if ((parseInt(materialName[1]) > 7 && parseInt(materialName[1]) < 13)) {
          switch (parseInt(materialName[1])) {
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
              modalMaterial((intersectedObject.material as THREE.MeshStandardMaterial).name, materialName[1])
            default:
          }
        } else if (parseInt(materialName[1]) === 7) {
          return;
        } else {
          modalMaterial((intersectedObject.material as THREE.MeshStandardMaterial).name, undefined)
        }
      } else {
        // moi noi se la: material_7 (khop noi xam') moi noi xam va tron nho
        // moi noi se la: "Shape_Copy.036" (khop noi den) ca shape mau den hinh tron
        // moi noi se la: "Shape.001" (khop noi Xanh Duong) va shape tron xanh Duong
        //can ket hop giua position va material name de lay ra het nhung phan lien ket
        highlightAtPosition(intersectedObject, intersectionPoint);
      }
    }
  });

  // Function to highlight the clicked area of the material
  function highlightAtPosition(object: THREE.Mesh, position: THREE.Vector3) {
    object.traverseAncestors((parent) => {
      if (parent.name == "Empty_30") {
        //Check clicking the side for rendering the panel
        const isClickedOnRightSide = (position.x < 0);
        parent.children.forEach((child) => {
          const isChildOnRightSide = (child.position.x > 0);
          if (isClickedOnRightSide === isChildOnRightSide) {
            const mesh = child.children[0] as THREE.Mesh;
            mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
            (mesh.material as THREE.MeshStandardMaterial).color.set(0xff0000);
          }
        })
      }
    })

    // place a marker to display the clicked point
    const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    scene.add(marker);

    // Remove the marker after a short delay
    setTimeout(() => {
      scene.remove(marker);
    }, 1000);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (modelIsReady) mixer.update(clock.getDelta())
    stats.update()
    renderer.render(scene, camera);
  }

  animate();

  //responsive the canvas
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

export type panelDetailsData = {
  materialName: string;
  durationDetail: string;
}

export function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [panelDetails, setPanelDetails] = useState<panelDetailsData>({
    materialName: "",
    durationDetail: "",
  })
  useEffect(() => {
    setup(containerRef.current!, setIsPanelVisible, setPanelDetails);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.scene} ref={containerRef} />
      {isPanelVisible && (
        <div className={styles.modalPanel}>
          <button
            onClick={() => setIsPanelVisible(false)}
            className={styles.button}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1rem"
              height="1rem"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4"
              />
            </svg>
          </button>
          <Panel
            props={styles.panel}
            materialName={panelDetails.materialName}
            durationDetail={panelDetails.durationDetail}
          />
        </div>
      )}
    </div>
  );
}
