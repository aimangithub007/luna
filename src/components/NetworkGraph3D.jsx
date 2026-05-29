import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ZoomIn, ZoomOut } from 'lucide-react';

export function NetworkGraph3D({ style, data, onNodeClick }) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const dataRef = useRef(data);
  
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);

  useEffect(() => {
    dataRef.current = data;
    if (data) {
       containerRef.current?.dispatchEvent(new CustomEvent('graph-data-update'));
    }
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000305, 0.006);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 800);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000305, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;

    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.9, 0.4, 0.22);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let particles;
    function buildParticles() {
      const N = 500, pos = new Float32Array(N*3), col = new Float32Array(N*3);
      for (let i = 0; i < N; i++) {
        pos[i*3] = (Math.random() - .5) * 500;
        pos[i*3+1] = (Math.random() - .5) * 500;
        pos[i*3+2] = (Math.random() - .5) * 500;
        const c = new THREE.Color().setHSL(.56 + Math.random()*.1, .4, .04 + Math.random()*.04);
        col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      particles = new THREE.Points(geo, new THREE.PointsMaterial({
        size: .28, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .55
      }));
      scene.add(particles);
    }

    const TYPE_COLORS = { core: 0xe8a820, memory: 0x4ab8d8, skill: 0x38c870, session: 0x9b72f0, tool: 0xf08030 };
    const TYPE_CSS = { core: '#e8a820', memory: '#4ab8d8', skill: '#38c870', session: '#9b72f0', tool: '#f08030' };
    
    let fallbackNodes = [
      {id:1, name:'Orchestrator', type:'core', size:150000},
      {id:2, name:'USER.md', type:'memory', size:18000},
      {id:3, name:'MEMORY.md', type:'memory', size:24000},
      {id:4, name:'skills/devops', type:'skill', size:80000},
      {id:5, name:'skills/github', type:'skill', size:75000}
    ];
    let fallbackEdges = [[1,2],[1,3], [1,4],[1,5]];

    let nodeMeshes = [], edgeLines = [];
    
    const getR = (size) => .5 + Math.pow(Math.max(0, size - 5000) / (2100000 - 5000), .38) * 5.2;

    function clearGraph() {
       nodeMeshes.forEach(m => {
           if (m.userData.halo) scene.remove(m.userData.halo);
           scene.remove(m);
           m.geometry.dispose(); m.material.dispose();
       });
       edgeLines.forEach(e => {
           scene.remove(e.line); scene.remove(e.glow);
           e.line.geometry.dispose(); e.line.material.dispose();
           e.glow.geometry.dispose(); e.glow.material.dispose();
       });
       nodeMeshes = []; edgeLines = [];
    }

    function buildGraph(activeNodes, activeEdges) {
      clearGraph();
      const positions = {};
      
      activeNodes.forEach((f, i) => {
        const typeIndex = Object.keys(TYPE_COLORS).indexOf(f.type);
        const ca = (typeIndex / 5) * Math.PI * 2;
        const r = f.type === 'core' ? 0 : 18 + ((i * 3.4) % 24);
        
        let x = Math.cos(ca + i*.3)*r + ((i*1.1)%8 - 4);
        let y = ((i*2.3)%28 - 14);
        let z = Math.sin(ca + i*.3)*r + ((i*1.7)%8 - 4);
        if (f.type === 'core') { x=0; y=0; z=0; }
        
        positions[f.id] = new THREE.Vector3(x, y, z);
        
        const radius = f.type === 'core' ? 3.5 : getR(f.size);
        const color = TYPE_COLORS[f.type] || 0xffffff;
        
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 2.6, 12, 12),
          new THREE.MeshBasicMaterial({
             color: new THREE.Color(color), transparent: true, opacity: .04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
          })
        );
        halo.position.copy(positions[f.id]);
        scene.add(halo);

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 32, 32),
          new THREE.MeshStandardMaterial({
             color: new THREE.Color(color).multiplyScalar(.15), emissive: new THREE.Color(color), emissiveIntensity: 2.4, roughness: .08, metalness: .0
          })
        );
        mesh.position.copy(positions[f.id]);
        mesh.userData = { ...f, origPos: positions[f.id].clone(), radius, phase: (i * 0.5) % (Math.PI*2), halo };
        scene.add(mesh);
        nodeMeshes.push(mesh);
      });

      activeEdges.forEach(([a, b], li) => {
        const pA = positions[a], pB = positions[b]; if(!pA||!pB) return;
        const nA = activeNodes.find(n=>n.id===a), nB = activeNodes.find(n=>n.id===b);
        if(!nA || !nB) return;
        
        const cA = new THREE.Color(TYPE_COLORS[nA.type]), cB = new THREE.Color(TYPE_COLORS[nB.type]);
        const edgeColor = new THREE.Color((cA.r+cB.r)/2, (cA.g+cB.g)/2, (cA.b+cB.b)/2);
        
        const bend = new THREE.Vector3(((li*1.1)%6 - 3), ((li*1.2)%6 - 3), ((li*1.3)%6 - 3));
        const mid = new THREE.Vector3().lerpVectors(pA, pB, .5).add(bend);
        const pts = new THREE.QuadraticBezierCurve3(pA, mid, pB).getPoints(40);
        
        const geoMain = new THREE.BufferGeometry().setFromPoints(pts);
        const matMain = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
        const line = new THREE.Line(geoMain, matMain);
        scene.add(line);
        
        const geoGlow = new THREE.BufferGeometry().setFromPoints(pts);
        const matGlow = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
        const glow = new THREE.Line(geoGlow, matGlow);
        scene.add(glow);
        
        edgeLines.push({ line, glow, a, b, li, edgeColor });
      });
    }

    buildParticles();
    const initial = dataRef.current || { nodes: fallbackNodes, edges: fallbackEdges };
    buildGraph(initial.nodes, initial.edges);

    let spherical = { theta: 0.3, phi: 1.2, r: 60 };
    let isDraggingCanvas = false;
    let hasMoved = false;
    let prevMouse = { x: 0, y: 0 };
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;

    function updateCamera() {
      camera.position.set(
        spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.r * Math.cos(spherical.phi),
        spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      );
      camera.lookAt(0, 0, 0);
    }
    updateCamera();

    const onMouseDown = (e) => { 
       if(e.target === renderer.domElement || e.target === container) {
          isDraggingCanvas = true; 
          hasMoved = false;
          prevMouse = { x: e.clientX, y: e.clientY }; 
       }
    };
    
    const onMouseUp = (e) => { 
       if (isDraggingCanvas && !hasMoved) {
          // Click!
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(nodeMeshes);
          
          if (hits.length > 0) {
             const d = hits[0].object.userData;
             // Find connections
             const localEdges = dataRef.current ? dataRef.current.edges : fallbackEdges;
             const conns = localEdges.filter(([a,b])=>a===d.id||b===d.id).length;
             
             if (onNodeClickRef.current) onNodeClickRef.current({...d, conns});
          } else {
             if (onNodeClickRef.current) onNodeClickRef.current(null);
          }
       }
       isDraggingCanvas = false; 
    };

    const onMouseMove = (e) => {
      if (isDraggingCanvas) {
        hasMoved = true;
        spherical.theta -= (e.clientX - prevMouse.x) * 0.005;
        spherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, spherical.phi + (e.clientY - prevMouse.y) * 0.005));
        prevMouse = { x: e.clientX, y: e.clientY };
        updateCamera();
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);

      const tip = tooltipRef.current;
      if (hits.length > 0) {
        const mesh = hits[0].object;
        if (hoveredMesh !== mesh) {
          if (hoveredMesh) unhover(hoveredMesh);
          hoveredMesh = mesh;
          hover(mesh);
          
          if (tip) {
            const d = mesh.userData;
            tip.querySelector('.tip-name').textContent = d.name;
            tip.querySelector('.tip-type').textContent = (d.type || 'unknown').toUpperCase() + ' NODE';
            tip.querySelector('.tip-type').style.color = TYPE_CSS[d.type] || '#fff';
            tip.querySelector('.tip-size').textContent = Math.round(d.size/1024) + ' KB';
            const localEdges = dataRef.current ? dataRef.current.edges : fallbackEdges;
            tip.querySelector('.tip-conns').textContent = localEdges.filter(([a,b])=>a===d.id||b===d.id).length;
          }
        }
        if (tip) {
          tip.style.display = 'block';
          tip.style.left = (e.clientX - rect.left + 16) + 'px';
          tip.style.top = (e.clientY - rect.top - 10) + 'px';
        }
        if(!isDraggingCanvas) container.style.cursor = 'pointer';
      } else {
        if (hoveredMesh) { unhover(hoveredMesh); hoveredMesh = null; }
        if (tip) tip.style.display = 'none';
        if(!isDraggingCanvas) container.style.cursor = 'default';
      }
    };
    
    const onZoom = (e) => {
      spherical.r = Math.max(16, Math.min(200, spherical.r + e.detail));
      updateCamera();
    };

    const onDataUpdate = () => {
      const newData = dataRef.current;
      if (!newData || !newData.nodes) return;
      if (newData.nodes.length !== nodeMeshes.length) {
         buildGraph(newData.nodes, newData.edges);
      } else {
         newData.nodes.forEach((n, i) => {
            if (nodeMeshes[i]) {
               nodeMeshes[i].userData.size = n.size;
               nodeMeshes[i].userData.modified = n.modified;
            }
         });
      }
    };

    function hover(mesh) {
      mesh.material.emissiveIntensity = 6.0;
      if (mesh.userData.halo) mesh.userData.halo.material.opacity = 0.18;
      edgeLines.forEach(obj => {
        if (obj.a === mesh.userData.id || obj.b === mesh.userData.id) {
          obj.line.material.opacity = 1.0;
          obj.glow.material.opacity = 0.55;
          obj.line.material.color.set(new THREE.Color(TYPE_COLORS[mesh.userData.type]));
          obj.glow.material.color.set(new THREE.Color(TYPE_COLORS[mesh.userData.type]));
        }
      });
    }

    function unhover(mesh) {
      mesh.material.emissiveIntensity = 2.4;
      if (mesh.userData.halo) mesh.userData.halo.material.opacity = 0.04;
      edgeLines.forEach(obj => {
        if (obj.a === mesh.userData.id || obj.b === mesh.userData.id) {
          obj.line.material.opacity = 0.5;
          obj.glow.material.opacity = 0.15;
          obj.line.material.color.copy(obj.edgeColor);
          obj.glow.material.color.copy(obj.edgeColor);
        }
      });
    }
    
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('graph-zoom', onZoom);
    container.addEventListener('graph-data-update', onDataUpdate);

    const clock = new THREE.Clock();
    let time = 0;
    let reqId;
    
    function animate() {
      reqId = requestAnimationFrame(animate);
      const dt = clock.getDelta(); time += dt;
      
      if (!isDraggingCanvas) { spherical.theta += 0.0010; updateCamera(); }
      if (particles) { particles.rotation.y += .00005; particles.rotation.x += .000025; }

      nodeMeshes.forEach(mesh => {
        const { phase, origPos, halo } = mesh.userData;
        const pulse = 1 + Math.sin(time*1.5 + phase)*.06;
        mesh.scale.setScalar(pulse);
        
        const nx = origPos.x + Math.sin(time*.22 + phase)*.20;
        const ny = origPos.y + Math.cos(time*.18 + phase)*.22;
        const nz = origPos.z + Math.sin(time*.26 + phase*1.1)*.20;
        mesh.position.set(nx, ny, nz);
        if (halo) halo.position.set(nx, ny, nz);

        if (mesh !== hoveredMesh) {
          const base = new THREE.Color(TYPE_COLORS[mesh.userData.type] || 0xffffff);
          const hsl = {}; base.getHSL(hsl);
          mesh.material.emissive.setHSL((hsl.h + Math.sin(time*.28 + phase)*.025 + 1) % 1, Math.min(1, hsl.s * 1.1), hsl.l);
          mesh.material.emissiveIntensity = 2.4 + Math.sin(time*1.8 + phase)*.6;
        }
      });

      edgeLines.forEach((obj, li) => {
        const mA = nodeMeshes.find(m => m.userData.id === obj.a);
        const mB = nodeMeshes.find(m => m.userData.id === obj.b);
        if (!mA || !mB) return;
        
        const bend = new THREE.Vector3(Math.sin(time*.2+li)*2.5, Math.cos(time*.16+li)*2.5, Math.sin(time*.24+li*1.2)*2.5);
        const mid = new THREE.Vector3().lerpVectors(mA.position, mB.position, .5).add(bend);
        const pts = new THREE.QuadraticBezierCurve3(mA.position, mid, mB.position).getPoints(40);
        
        [obj.line, obj.glow].forEach(lineObj => {
          if (!lineObj) return;
          const pos = lineObj.geometry.attributes.position;
          pts.forEach((p, k) => pos.setXYZ(k, p.x, p.y, p.z));
          pos.needsUpdate = true;
        });

        if (!hoveredMesh || (obj.a !== hoveredMesh.userData.id && obj.b !== hoveredMesh.userData.id)) {
          const breath = .5 + Math.sin(time*.4+li*.5)*.12;
          obj.line.material.opacity = breath;
          obj.glow.material.opacity = .15 + Math.sin(time*.4+li*.5)*.06;
        }
      });

      composer.render();
    }
    animate();

    const handleResize = () => {
       if (!containerRef.current) return;
       const w = containerRef.current.clientWidth;
       const h = containerRef.current.clientHeight;
       camera.aspect = w / h;
       camera.updateProjectionMatrix();
       renderer.setSize(w, h);
       composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      if (container) {
          container.removeEventListener('mousedown', onMouseDown);
          container.removeEventListener('mousemove', onMouseMove);
          container.removeEventListener('graph-zoom', onZoom);
          container.removeEventListener('graph-data-update', onDataUpdate);
      }
      window.removeEventListener('mouseup', onMouseUp);
      
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
         container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []); // Only runs once on mount

  const handleZoomIn = () => containerRef.current?.dispatchEvent(new CustomEvent('graph-zoom', { detail: -15 }));
  const handleZoomOut = () => containerRef.current?.dispatchEvent(new CustomEvent('graph-zoom', { detail: 15 }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 350, overflow: 'hidden', borderRadius: 8, ...style }}>
       <div ref={containerRef} style={{ position: 'absolute', inset: 0, cursor: 'default' }} />
       
       {/* Tooltip Overlay */}
       <div ref={tooltipRef} style={{
          position: 'absolute', zIndex: 20, pointerEvents: 'none', display: 'none',
          background: 'rgba(0,3,6,.96)', border: '0.5px solid rgba(255,255,255,.12)',
          borderRadius: 10, padding: '10px 14px', minWidth: 160, backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', transition: 'opacity 0.2s'
       }}>
          <div className="tip-name" style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 4 }}></div>
          <div className="tip-type" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#2a3a4a', fontSize: 11, marginTop: 2 }}>
             <span style={{ color: '#5a7a94' }}>Size</span>
             <span className="tip-size" style={{ color: '#e8eaf0' }}></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#2a3a4a', fontSize: 11, marginTop: 2 }}>
             <span style={{ color: '#5a7a94' }}>Connections</span>
             <span className="tip-conns" style={{ color: '#e8eaf0' }}></span>
          </div>
       </div>

       <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Core</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
             <Legend color="#e8a820" label="Core" />
             <Legend color="#4ab8d8" label="Memory" />
             <Legend color="#38c870" label="Skills" />
             <Legend color="#9b72f0" label="Sessions" />
          </div>
       </div>

       {/* Zoom Controls */}
       <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 10, display: 'flex', gap: 8 }}>
          <button className="btn ba" onClick={handleZoomIn} title="Zoom In" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <ZoomIn size={14} />
          </button>
          <button className="btn ba" onClick={handleZoomOut} title="Zoom Out" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <ZoomOut size={14} />
          </button>
       </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#aaa' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}
