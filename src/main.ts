import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood'
type SavedFriend = { id: string; name: string; portrait: string; color: string }

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="game-shell">
    <div id="world" aria-label="עולם בלוקים תלת־ממדי"></div>

    <header class="topbar glass">
      <button class="brand" id="home-button" aria-label="חזרה למסך הבית של יאירקראפט">
        <span class="brand-cube"><i></i></span>
        <span>יאירקראפט</span>
      </button>
      <div class="world-status"><span class="status-dot"></span><span>אחו יום ההולדת</span><small>עולם המסיבה</small></div>
      <div class="top-actions">
        <button class="icon-button" id="sound-button" aria-label="הפעלה או השתקה של הצלילים">♫</button>
        <button class="primary-button" id="open-creator"><span>+</span> הוספת חברים</button>
      </div>
    </header>

    <section class="welcome-card glass" id="welcome-card">
      <button class="close-card" id="dismiss-welcome" aria-label="סגירת הברכה">×</button>
      <div class="party-sprinkles" aria-hidden="true">✦　◆　●　✦　■</div>
      <p class="eyebrow">עולם קטן ליום גדול</p>
      <h1>יום הולדת שמח, יאיר!<br><em>מתחילים לחגוג.</em></h1>
      <p>כולם מחכים לך ליד העוגה. אפשר לטייל במסיבה, לפתוח מתנות ולבנות יחד משהו בלתי נשכח.</p>
      <button class="play-button" id="play-button"><span>▶</span> כניסה למסיבה</button>
      <div class="controls-row"><kbd>WASD</kbd> תנועה <span></span><kbd>SPACE</kbd> קפיצה <span></span><kbd>E</kbd> תיק</div>
    </section>

    <aside class="creator-panel" id="creator-panel" aria-label="יצירת דמות של חבר או חברה">
      <div class="panel-head">
        <div><p class="eyebrow">סטודיו לדמויות</p><h2>הוספת חברים</h2></div>
        <button class="panel-close" id="close-creator" aria-label="סגירת הסטודיו">×</button>
      </div>
      <div class="portrait-drop" id="portrait-drop">
        <input id="portrait-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>
        <input id="camera-input" type="file" accept="image/*" capture="user" hidden>
        <div class="portrait-preview" id="portrait-preview">
          <span class="upload-icon">↥</span>
          <strong>גררו לכאן תמונת פנים</strong>
          <small>או לחצו כדי לבחור תמונה</small>
        </div>
        <div class="camera-stage" id="camera-stage">
          <video id="camera-video" autoplay muted playsinline aria-label="תצוגה מקדימה של המצלמה"></video>
          <div class="camera-controls">
            <button id="cancel-camera" type="button">ביטול</button>
            <button id="capture-camera" type="button"><i></i> צילום</button>
          </div>
        </div>
        <button class="change-photo" id="change-photo">החלפה</button>
      </div>
      <div class="portrait-actions">
        <button id="choose-photo" type="button"><span>↥</span> בחירת תמונה</button>
        <button id="open-camera" type="button"><span>◉</span> שימוש במצלמה</button>
      </div>
      <label class="field-label" for="friend-name">שם הדמות</label>
      <input class="text-input" id="friend-name" type="text" maxlength="18" placeholder="למשל: מאיה" autocomplete="off">
      <label class="field-label">צבע החולצה</label>
      <div class="swatches" id="swatches">
        <button class="swatch active" data-color="#ef654f" style="--swatch:#ef654f" aria-label="אלמוג"></button>
        <button class="swatch" data-color="#e8a83d" style="--swatch:#e8a83d" aria-label="זהב"></button>
        <button class="swatch" data-color="#5a9f78" style="--swatch:#5a9f78" aria-label="ירוק"></button>
        <button class="swatch" data-color="#4f87be" style="--swatch:#4f87be" aria-label="כחול"></button>
        <button class="swatch" data-color="#936fb0" style="--swatch:#936fb0" aria-label="סגול"></button>
      </div>
      <div class="mini-avatar" id="mini-avatar" aria-hidden="true">
        <div class="mini-head"><div id="mini-face">:)</div></div>
        <div class="mini-body"><i></i><b></b><i></i></div>
      </div>
      <p class="creator-hint">התמונה תיחתך לריבוע ותקבל מראה מפוקסל עדין.</p>
      <button class="spawn-button" id="spawn-button">יצירה והוספה לעולם <span>←</span></button>
    </aside>

    <div class="crosshair" id="crosshair"><i></i><i></i></div>
    <div class="npc-prompt glass" id="npc-prompt"><kbd>F</kbd> לדבר עם <b></b></div>
    <div class="lock-hint" id="lock-hint">לחצו על העולם כדי להביט סביב · <kbd>Esc</kbd> לשחרור העכבר</div>

    <section class="people-dock glass">
      <div class="dock-title"><span>החברים שלך</span><b id="friend-count">0 / 8</b></div>
      <div class="people-list" id="people-list"></div>
      <button class="dock-add" id="dock-add" aria-label="הוספת חבר או חברה"><span>+</span><small>הוספת חברים</small></button>
    </section>

    <nav class="hotbar glass" aria-label="סרגל קוביות לבנייה">
      <button class="block-slot active" data-block="grass"><i class="block-icon grass"></i><span>1</span></button>
      <button class="block-slot" data-block="dirt"><i class="block-icon dirt"></i><span>2</span></button>
      <button class="block-slot" data-block="stone"><i class="block-icon stone"></i><span>3</span></button>
      <button class="block-slot" data-block="wood"><i class="block-icon wood"></i><span>4</span></button>
    </nav>

    <section class="inventory-panel glass" id="inventory-panel" aria-label="תיק הקוביות" aria-hidden="true">
      <div class="inventory-head">
        <div><p class="eyebrow">התיק שלי</p><h2>קוביות בנייה</h2></div>
        <button id="close-inventory" aria-label="סגירת התיק">×</button>
      </div>
      <div class="inventory-grid">
        <button data-inventory-block="grass"><i class="block-icon grass"></i><b>קוביית דשא</b><small>1</small></button>
        <button data-inventory-block="dirt"><i class="block-icon dirt"></i><b>אדמה</b><small>2</small></button>
        <button data-inventory-block="stone"><i class="block-icon stone"></i><b>אבן</b><small>3</small></button>
        <button data-inventory-block="wood"><i class="block-icon wood"></i><b>גזע אלון</b><small>4</small></button>
      </div>
      <div class="key-guide">
        <span><kbd>WASD</kbd> תנועה</span><span><kbd>SPACE</kbd> קפיצה</span>
        <span><kbd>SHIFT</kbd> התגנבות</span><span><kbd>CTRL</kbd> ריצה</span>
        <span><kbd>LMB</kbd> חציבה</span><span><kbd>RMB</kbd> הנחה</span>
        <span><kbd>MMB</kbd> בחירת קובייה</span><span><kbd>ESC</kbd> השהיה</span>
      </div>
      <p>לחצו על <kbd>E</kbd> לסגירה</p>
    </section>

    <div class="game-tip glass" id="game-tip"><kbd>LMB</kbd> חציבה <span></span><kbd>RMB</kbd> הנחה <span></span><kbd>CTRL</kbd> ריצה</div>

    <div class="toast" id="toast"></div>
  </main>
`

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!
const worldEl = $('#world')
const creatorPanel = $('#creator-panel')
const welcomeCard = $('#welcome-card')
const portraitInput = $('#portrait-input') as HTMLInputElement
const cameraInput = $('#camera-input') as HTMLInputElement
const portraitPreview = $('#portrait-preview')
const cameraVideo = $('#camera-video') as HTMLVideoElement
const friendName = $('#friend-name') as HTMLInputElement
const peopleList = $('#people-list')
const toast = $('#toast')
const inventoryPanel = $('#inventory-panel')

// --- Scene -----------------------------------------------------------------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x9dc8cf)
scene.fog = new THREE.Fog(0x9dc8cf, 32, 70)

const camera = new THREE.PerspectiveCamera(66, 1, 0.1, 120)
camera.position.set(0, 7, 12)

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.domElement.tabIndex = 0
renderer.domElement.setAttribute('aria-label', 'עולם בלוקים. לחצו Enter כדי לשחק, E לפתיחת התיק ו-Escape להשהיה.')
worldEl.appendChild(renderer.domElement)

const controls = new PointerLockControls(camera, renderer.domElement)
scene.add(controls.object)

scene.add(new THREE.HemisphereLight(0xd6f1ff, 0x48623b, 2.1))
const sun = new THREE.DirectionalLight(0xfff1c9, 2.8)
sun.position.set(-16, 28, 12)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -30
sun.shadow.camera.right = 30
sun.shadow.camera.top = 30
sun.shadow.camera.bottom = -30
scene.add(sun)

const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe0a0 }),
)
sunDisc.position.set(-32, 28, -45)
scene.add(sunDisc)

function pixelTexture(colors: string[], size = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, size, size)
  const cell = size / 8
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const hash = (x * 7 + y * 11 + x * y * 3) % colors.length
      ctx.globalAlpha = 0.28 + ((x + y) % 3) * 0.11
      ctx.fillStyle = colors[hash]
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }
  ctx.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const textures = {
  grass: pixelTexture(['#6fa44a', '#83b955', '#5e933e', '#9bc96b']),
  dirt: pixelTexture(['#815631', '#9a6a3b', '#6f4829', '#aa7543']),
  stone: pixelTexture(['#7c817d', '#959b96', '#666b68', '#a8aaa3']),
  wood: pixelTexture(['#78502d', '#96673a', '#624022', '#aa7741']),
  leaves: pixelTexture(['#315f38', '#3e7542', '#51874b', '#264e31']),
  sand: pixelTexture(['#d5c07d', '#e4d18e', '#c5ae6b', '#efdca2']),
}

const materialFor = (type: BlockType | 'leaves' | 'sand') => new THREE.MeshLambertMaterial({ map: textures[type] })
const materials: Record<BlockType | 'leaves' | 'sand', THREE.Material> = {
  grass: materialFor('grass'), dirt: materialFor('dirt'), stone: materialFor('stone'),
  wood: materialFor('wood'), leaves: materialFor('leaves'), sand: materialFor('sand'),
}
const geometry = new THREE.BoxGeometry(1, 1, 1)
const blocks = new Map<string, THREE.Mesh>()
const raycastTargets: THREE.Object3D[] = []
const keyFor = (x: number, y: number, z: number) => `${x},${y},${z}`

function addBlock(x: number, y: number, z: number, type: BlockType | 'leaves' | 'sand', editable = true) {
  const key = keyFor(x, y, z)
  if (blocks.has(key)) return
  const mesh = new THREE.Mesh(geometry, materials[type])
  mesh.position.set(x, y, z)
  mesh.castShadow = type !== 'leaves'
  mesh.receiveShadow = true
  mesh.userData = { type, editable }
  scene.add(mesh)
  blocks.set(key, mesh)
  raycastTargets.push(mesh)
}

function removeBlock(mesh: THREE.Mesh) {
  if (!mesh.userData.editable) return
  blocks.delete(keyFor(mesh.position.x, mesh.position.y, mesh.position.z))
  raycastTargets.splice(raycastTargets.indexOf(mesh), 1)
  scene.remove(mesh)
}

function terrainHeight(x: number, z: number) {
  const wave = Math.sin(x * 0.31) * 0.7 + Math.cos(z * 0.27) * 0.65 + Math.sin((x + z) * 0.19) * 0.55
  return Math.max(1, Math.round(2.2 + wave))
}

for (let x = -18; x <= 18; x++) {
  for (let z = -18; z <= 18; z++) {
    const h = terrainHeight(x, z)
    const edge = Math.max(Math.abs(x), Math.abs(z)) > 16
    for (let y = -1; y <= h; y++) {
      const type = edge && y === h ? 'sand' : y === h ? 'grass' : y > h - 2 ? 'dirt' : 'stone'
      addBlock(x, y, z, type, y === h)
    }
  }
}

function addTree(x: number, z: number) {
  const base = terrainHeight(x, z) + 1
  for (let y = 0; y < 4; y++) addBlock(x, base + y, z, 'wood', true)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 3; dy <= 5; dy++) {
    if (Math.abs(dx) + Math.abs(dz) + (dy === 5 ? 1 : 0) < 4) addBlock(x + dx, base + dy, z + dz, 'leaves', true)
  }
}

;[[-10, -7], [12, -9], [-13, 8], [9, 11], [14, 4], [-5, 13]].forEach(([x, z]) => addTree(x, z))

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 90),
  new THREE.MeshPhongMaterial({ color: 0x5e9ea8, transparent: true, opacity: 0.72, shininess: 90 }),
)
water.rotation.x = -Math.PI / 2
water.position.y = 0.46
scene.add(water)

const clouds: THREE.Group[] = []
for (let i = 0; i < 7; i++) {
  const cloud = new THREE.Group()
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf4f1df })
  for (let j = 0; j < 4 + (i % 3); j++) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(3 + (j % 2), 0.75, 1.5), cloudMat)
    cube.position.set(j * 2.2, (j % 2) * 0.45, 0)
    cloud.add(cube)
  }
  cloud.position.set(-35 + i * 12, 19 + (i % 3) * 2, -18 - (i % 2) * 15)
  scene.add(cloud)
  clouds.push(cloud)
}

// --- Birthday party --------------------------------------------------------
const partyPalette = ['#ef654f', '#f1b642', '#65a979', '#5593c7', '#a777bd', '#f08bb4']
const partyMaterials = partyPalette.map((color) => new THREE.MeshLambertMaterial({
  map: pixelTexture([color, color, '#ffffff', color]),
}))
const cakeMaterial = new THREE.MeshLambertMaterial({ map: pixelTexture(['#9a5d3e', '#b9714c', '#7c472f', '#d78b63']) })
const frostingMaterial = new THREE.MeshLambertMaterial({ map: pixelTexture(['#fff8e5', '#ffffff', '#f8d9dc', '#fff4d2']) })
const candleMaterial = new THREE.MeshLambertMaterial({ map: pixelTexture(['#f1b642', '#fff2a9', '#e89532', '#f7cc5e']) })
const presentMeshes: THREE.Mesh[] = []
const candleFlames: THREE.Mesh[] = []
const balloons: THREE.Mesh[] = []

function addPartyCube(x: number, y: number, z: number, material: THREE.Material, label = 'party') {
  const key = keyFor(x, y, z)
  if (blocks.has(key)) return blocks.get(key)!
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData = { type: label, editable: false }
  scene.add(mesh)
  blocks.set(key, mesh)
  raycastTargets.push(mesh)
  return mesh
}

// A patchwork dance floor that follows the terrain instead of flattening it.
for (let x = -4; x <= 4; x++) for (let z = 0; z <= 7; z++) {
  const tile = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.12, 0.94), partyMaterials[(x + z + 24) % partyMaterials.length])
  tile.position.set(x, terrainHeight(x, z) + 0.57, z)
  tile.receiveShadow = true
  scene.add(tile)
}

// Giant voxel birthday cake and glowing candles.
const cakeX = 0
const cakeZ = -4
const cakeGround = terrainHeight(cakeX, cakeZ)
for (let x = -2; x <= 2; x++) for (let z = -1; z <= 1; z++) addPartyCube(cakeX + x, cakeGround + 1, cakeZ + z, cakeMaterial, 'cake')
for (let x = -2; x <= 2; x++) for (let z = -1; z <= 1; z++) {
  const icing = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.18, 0.94), frostingMaterial)
  icing.position.set(cakeX + x, cakeGround + 1.52, cakeZ + z)
  icing.castShadow = true
  scene.add(icing)
}
for (let x = -1; x <= 1; x++) addPartyCube(cakeX + x, cakeGround + 2, cakeZ, frostingMaterial, 'cake')
for (const x of [-1, 0, 1]) {
  const candle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), candleMaterial)
  candle.position.set(cakeX + x, cakeGround + 2.86, cakeZ)
  candle.castShadow = true
  scene.add(candle)
  const flame = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.28, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffc44f, emissive: 0xff6f26, emissiveIntensity: 2.5 }),
  )
  flame.position.set(cakeX + x, cakeGround + 3.35, cakeZ)
  flame.userData.baseY = flame.position.y
  scene.add(flame)
  candleFlames.push(flame)
}

function addPresent(x: number, z: number, colorIndex: number) {
  const ground = terrainHeight(x, z)
  const box = addPartyCube(x, ground + 1, z, partyMaterials[colorIndex % partyMaterials.length], 'present')
  box.userData.present = true
  const ribbonMaterial = partyMaterials[(colorIndex + 2) % partyMaterials.length]
  const ribbonX = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.04, 1.04), ribbonMaterial)
  const ribbonZ = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.04, 0.18), ribbonMaterial)
  ribbonX.position.copy(box.position)
  ribbonZ.position.copy(box.position)
  scene.add(ribbonX, ribbonZ)
  presentMeshes.push(box)
}

;[[-6, 1, 0], [6, 2, 1], [-5, -5, 2], [5, -5, 4], [-7, 5, 3], [7, 6, 5]].forEach(([x, z, color]) => addPresent(x, z, color))

function addBalloonCluster(x: number, z: number, startColor: number) {
  const ground = terrainHeight(x, z)
  for (let i = 0; i < 3; i++) {
    const offsetX = (i - 1) * 0.7
    const offsetY = i % 2 ? 0.6 : 0
    const string = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, ground + 0.6, z), new THREE.Vector3(x + offsetX, ground + 4.2 + offsetY, z)]),
      new THREE.LineBasicMaterial({ color: 0xe6e1ca }),
    )
    scene.add(string)
    const balloon = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.72), partyMaterials[(startColor + i) % partyMaterials.length])
    balloon.position.set(x + offsetX, ground + 4.5 + offsetY, z)
    balloon.rotation.y = Math.PI / 4
    balloon.castShadow = true
    balloon.userData = { phase: i + x, baseY: balloon.position.y }
    scene.add(balloon)
    balloons.push(balloon)
  }
}

addBalloonCluster(-8, -2, 0)
addBalloonCluster(8, -2, 3)
addBalloonCluster(-8, 7, 2)
addBalloonCluster(8, 7, 5)

function addBunting(z: number, height: number) {
  const ropePoints: THREE.Vector3[] = []
  for (let x = -10; x <= 10; x++) ropePoints.push(new THREE.Vector3(x, height - Math.cos((x / 10) * Math.PI) * 0.65, z))
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ropePoints), new THREE.LineBasicMaterial({ color: 0xf5ead0 })))
  for (let x = -9; x <= 9; x += 2) {
    const y = height - Math.cos((x / 10) * Math.PI) * 0.65 - 0.4
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.82, 0.08), partyMaterials[((x + 9) / 2) % partyMaterials.length])
    flag.position.set(x, y, z)
    flag.rotation.z = x * 0.006
    scene.add(flag)
  }
}

addBunting(-1, 9.5)
addBunting(6, 8.8)

// Block sign facing the spawn point.
const signCanvas = document.createElement('canvas')
signCanvas.width = 512
signCanvas.height = 128
const signContext = signCanvas.getContext('2d')!
signContext.fillStyle = '#315e45'
signContext.fillRect(0, 0, 512, 128)
signContext.fillStyle = '#f4c95d'
signContext.font = 'bold 43px sans-serif'
signContext.textAlign = 'center'
signContext.textBaseline = 'middle'
signContext.direction = 'rtl'
signContext.fillText('יום הולדת שמח, יאיר!', 256, 64)
const signTexture = new THREE.CanvasTexture(signCanvas)
signTexture.colorSpace = THREE.SRGBColorSpace
signTexture.magFilter = THREE.NearestFilter
const signSides = new THREE.MeshLambertMaterial({ color: 0x754d2d })
const signFace = new THREE.MeshBasicMaterial({ map: signTexture })
const birthdaySign = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.85, 0.32), [signSides, signSides, signSides, signSides, signFace, signSides])
birthdaySign.position.set(0, terrainHeight(0, -8) + 5.3, -8)
birthdaySign.castShadow = true
scene.add(birthdaySign)
for (const x of [-2.5, 2.5]) {
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.32), materials.wood)
  post.position.set(x, terrainHeight(Math.round(x), -8) + 2.1, -8)
  post.castShadow = true
  scene.add(post)
}

// Square confetti keeps the scene celebratory without relying on external art.
const confettiCount = 260
const confettiPositions = new Float32Array(confettiCount * 3)
const confettiColors = new Float32Array(confettiCount * 3)
for (let i = 0; i < confettiCount; i++) {
  confettiPositions[i * 3] = (Math.random() - 0.5) * 22
  confettiPositions[i * 3 + 1] = 4 + Math.random() * 13
  confettiPositions[i * 3 + 2] = -9 + Math.random() * 18
  const color = new THREE.Color(partyPalette[i % partyPalette.length])
  confettiColors.set([color.r, color.g, color.b], i * 3)
}
const confettiGeometry = new THREE.BufferGeometry()
confettiGeometry.setAttribute('position', new THREE.BufferAttribute(confettiPositions, 3))
confettiGeometry.setAttribute('color', new THREE.BufferAttribute(confettiColors, 3))
const confetti = new THREE.Points(confettiGeometry, new THREE.PointsMaterial({ size: 0.17, vertexColors: true, sizeAttenuation: true }))
scene.add(confetti)

// --- Characters ------------------------------------------------------------
const avatars = new Map<string, THREE.Group>()
const npcTargets: THREE.Object3D[] = []
const savedFriends: SavedFriend[] = JSON.parse(localStorage.getItem('minefolk-friends') || '[]')
let pendingPortrait = ''
let shirtColor = '#ef654f'
let cameraStream: MediaStream | null = null

function colorMaterial(color: string) { return new THREE.MeshLambertMaterial({ color }) }

function portraitTexture(dataUrl: string, onReady: (texture: THREE.Texture) => void) {
  new THREE.TextureLoader().load(dataUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.LinearFilter
    onReady(texture)
  })
}

function makeSpeechBubble() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 144
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4.2, 1.18, 1)
  sprite.position.y = 4.35
  sprite.visible = false
  sprite.renderOrder = 20
  sprite.userData.canvas = canvas
  return sprite
}

function setSpeech(sprite: THREE.Sprite, name: string, message: string) {
  const material = sprite.material as THREE.SpriteMaterial
  const canvas = sprite.userData.canvas as HTMLCanvasElement
  const context = canvas.getContext('2d')!
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(255, 253, 242, .96)'
  context.strokeStyle = '#315e45'
  context.lineWidth = 7
  context.beginPath()
  context.roundRect(8, 8, 496, 112, 20)
  context.fill()
  context.stroke()
  context.beginPath()
  context.moveTo(236, 119)
  context.lineTo(256, 140)
  context.lineTo(278, 119)
  context.fill()
  context.stroke()
  context.fillStyle = '#ef654f'
  context.font = 'bold 22px monospace'
  context.textAlign = 'center'
  context.direction = 'rtl'
  context.fillText(name.toUpperCase(), 256, 42)
  context.fillStyle = '#18362d'
  context.font = 'bold 27px sans-serif'
  const trimmed = message.length > 35 ? `${message.slice(0, 33)}…` : message
  context.fillText(trimmed, 256, 84)
  material.map!.needsUpdate = true
}

function makeAvatar(friend: SavedFriend, index: number) {
  if (avatars.has(friend.id)) return
  const group = new THREE.Group()
  const bodyMat = colorMaterial(friend.color)
  const skinMat = colorMaterial('#d8a77c')
  const darkMat = colorMaterial('#38404a')
  const headMats: THREE.Material[] = [skinMat, skinMat, skinMat, skinMat, skinMat, skinMat]
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), headMats)
  head.position.y = 2.35
  head.castShadow = true
  group.add(head)
  head.userData.npcId = friend.id
  npcTargets.push(head)
  portraitTexture(friend.portrait, (texture) => {
    const faceMat = new THREE.MeshBasicMaterial({ map: texture })
    headMats[4] = faceMat
    head.material = headMats
  })
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.48), bodyMat)
  body.position.y = 1.36
  body.castShadow = true
  body.userData.npcId = friend.id
  group.add(body)
  npcTargets.push(body)
  const arms: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.05, 0.34), skinMat)
    arm.position.set(side * 0.61, 1.38, 0)
    arm.castShadow = true
    arm.userData.limb = true
    group.add(arm)
    arms.push(arm)
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.95, 0.42), darkMat)
    leg.position.set(side * 0.22, 0.4, 0)
    leg.castShadow = true
    leg.userData.limb = true
    group.add(leg)
  }
  const partyHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 0.82, 4),
    partyMaterials[index % partyMaterials.length],
  )
  partyHat.position.y = 3.2
  partyHat.rotation.y = Math.PI / 4
  partyHat.castShadow = true
  group.add(partyHat)
  const pomPom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), frostingMaterial)
  pomPom.position.y = 3.66
  group.add(pomPom)
  const speechBubble = makeSpeechBubble()
  group.add(speechBubble)
  const angle = (index / Math.max(1, savedFriends.length)) * Math.PI * 2
  const x = Math.round(Math.cos(angle) * (4 + index * 0.35))
  const z = Math.round(Math.sin(angle) * (4 + index * 0.35))
  group.position.set(x, terrainHeight(x, z) + 0.5, z)
  group.rotation.y = Math.atan2(camera.position.x - x, camera.position.z - z)
  group.userData = {
    id: friend.id,
    name: friend.name,
    baseY: group.position.y,
    phase: index * 1.7,
    state: 'idle',
    target: new THREE.Vector3(x, 0, z),
    nextDecision: performance.now() + 1200 + index * 650,
    speechUntil: 0,
    lastPlayerGreeting: 0,
    partnerId: '',
    followUntil: 0,
    speechBubble,
    arms,
  }
  scene.add(group)
  avatars.set(friend.id, group)
}

function persistFriends() {
  localStorage.setItem('minefolk-friends', JSON.stringify(savedFriends))
}

function renderPeople() {
  peopleList.innerHTML = ''
  $('#friend-count').textContent = `${savedFriends.length} / 8`
  if (!savedFriends.length) {
    peopleList.innerHTML = '<p class="empty-people">עדיין אין כאן אף אחד. אפשר להוסיף חברים לעולם.</p>'
    return
  }
  savedFriends.forEach((friend) => {
    const entry = document.createElement('div')
    entry.className = 'person-entry'
    const card = document.createElement('button')
    card.className = 'person-card'
    card.type = 'button'
    card.setAttribute('aria-label', `מציאת ${friend.name} בעולם`)
    card.innerHTML = `<span class="person-face"><img src="${friend.portrait}" alt=""><i style="--shirt:${friend.color}"></i></span><span>${escapeHtml(friend.name)}</span><small>בעולם</small>`
    card.addEventListener('click', () => focusFriend(friend.id))
    const removeButton = document.createElement('button')
    removeButton.className = 'person-remove'
    removeButton.type = 'button'
    removeButton.setAttribute('aria-label', `הסרת ${friend.name}`)
    removeButton.title = `הסרת ${friend.name}`
    removeButton.textContent = '×'
    removeButton.addEventListener('click', () => removeFriend(friend.id))
    entry.append(card, removeButton)
    peopleList.appendChild(entry)
  })
}

function escapeHtml(value: string) {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}

function focusFriend(id: string) {
  const avatar = avatars.get(id)
  if (!avatar) return
  if (controls.isLocked) controls.unlock()
  camera.position.set(avatar.position.x + 3.8, avatar.position.y + 2.4, avatar.position.z + 4.4)
  camera.lookAt(avatar.position.x, avatar.position.y + 1.4, avatar.position.z)
  showToast(`${savedFriends.find((friend) => friend.id === id)?.name} נמצא או נמצאת ממש כאן`)
}

function removeFriend(id: string) {
  const friendIndex = savedFriends.findIndex((friend) => friend.id === id)
  if (friendIndex === -1) return
  const friend = savedFriends[friendIndex]
  if (!window.confirm(`להסיר את ${friend.name} מהעולם?`)) return

  const avatar = avatars.get(id)
  if (avatar) {
    scene.remove(avatar)
    avatars.delete(id)
  }
  for (let index = npcTargets.length - 1; index >= 0; index--) {
    if (npcTargets[index].userData.npcId === id) npcTargets.splice(index, 1)
  }
  avatars.forEach((npc) => {
    if (npc.userData.partnerId !== id) return
    npc.userData.partnerId = ''
    npc.userData.state = 'idle'
    npc.userData.nextDecision = performance.now()
  })
  savedFriends.splice(friendIndex, 1)
  persistFriends()
  renderPeople()
  showToast(`${friend.name} הוסר או הוסרה מהעולם`)
}

const playerGreetings = [
  'יום הולדת שמח, יאיר! תבקש משאלה!',
  'המסיבה הזאת נבנתה במיוחד בשבילך!',
  'יאיר, בוא נפתח מתנה!',
  'העוגה פשוט ענקית!',
  'שמרתי לך מקום ברחבת הריקודים!',
]
const worldRemarks = ['אני רוצה את הפרוסה הכי גדולה!', 'איזה בלונים קובייתיים!', 'רחבת הריקודים קוראת לנו!', 'עולם המסיבה הכי טוב שיש!']

function speakNpc(npc: THREE.Group, message: string, duration = 3400) {
  const bubble = npc.userData.speechBubble as THREE.Sprite
  setSpeech(bubble, npc.userData.name, message)
  bubble.visible = true
  npc.userData.speechUntil = performance.now() + duration
  const arms = npc.userData.arms as THREE.Mesh[]
  if (arms[0]) arms[0].rotation.z = -1.15
}

function distance2D(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function chooseNpcAction(npc: THREE.Group, now: number) {
  const playerDistance = distance2D(npc.position, camera.position)
  if (gameActive && playerDistance < 5.2 && now - npc.userData.lastPlayerGreeting > 18000) {
    npc.userData.state = 'greet-player'
    npc.userData.target.set(camera.position.x, 0, camera.position.z)
    npc.userData.lastPlayerGreeting = now
    npc.userData.nextDecision = now + 5200
    speakNpc(npc, playerGreetings[Math.floor(Math.random() * playerGreetings.length)])
    return
  }

  const peers = [...avatars.values()].filter((other) => other !== npc && distance2D(npc.position, other.position) < 10)
  if (peers.length && Math.random() < 0.44) {
    const partner = peers[Math.floor(Math.random() * peers.length)]
    npc.userData.state = 'socialize'
    npc.userData.partnerId = partner.userData.id
    npc.userData.target.set(partner.position.x + (Math.random() - 0.5) * 1.8, 0, partner.position.z + (Math.random() - 0.5) * 1.8)
    npc.userData.hasSpoken = false
    npc.userData.nextDecision = now + 7000
    return
  }

  if (Math.random() < 0.36) {
    const partyStops = [
      new THREE.Vector3(cakeX + 3, 0, cakeZ + 1),
      new THREE.Vector3(cakeX - 3, 0, cakeZ + 1),
      ...presentMeshes.map((present) => present.position.clone()),
    ]
    const stop = partyStops[Math.floor(Math.random() * partyStops.length)]
    npc.userData.state = 'explore-party'
    npc.userData.target.set(stop.x, 0, stop.z)
    npc.userData.hasSpoken = false
    npc.userData.nextDecision = now + 7000
    return
  }

  npc.userData.state = 'wander'
  npc.userData.target.set((Math.random() - 0.5) * 15, 0, -5 + Math.random() * 13)
  npc.userData.nextDecision = now + 5000 + Math.random() * 4000
}

function updateNpc(npc: THREE.Group, now: number, delta: number) {
  if (npc.userData.followUntil > now) {
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    npc.userData.state = 'follow-player'
    npc.userData.target.set(camera.position.x - forward.x * 2.2, 0, camera.position.z - forward.z * 2.2)
  } else if (now > npc.userData.nextDecision) {
    chooseNpcAction(npc, now)
  }

  if (npc.userData.state === 'socialize') {
    const partner = avatars.get(npc.userData.partnerId)
    if (partner) npc.userData.target.set(partner.position.x + 1.25, 0, partner.position.z + 0.65)
  }

  const target = npc.userData.target as THREE.Vector3
  const dx = target.x - npc.position.x
  const dz = target.z - npc.position.z
  const distance = Math.hypot(dx, dz)
  const stopDistance = npc.userData.state === 'follow-player' ? 2 : 0.72
  if (distance > stopDistance) {
    const step = Math.min(distance, delta * (npc.userData.state === 'follow-player' ? 2.15 : 1.25))
    const nextX = npc.position.x + (dx / distance) * step
    const nextZ = npc.position.z + (dz / distance) * step
    const currentGround = heightAt(npc.position.x, npc.position.z)
    const nextGround = heightAt(nextX, nextZ)
    const occupied = [...avatars.values()].some((other) => other !== npc && Math.hypot(other.position.x - nextX, other.position.z - nextZ) < 0.72)
    if (Math.abs(nextGround - currentGround) <= 1.05 && !occupied) {
      npc.position.x = nextX
      npc.position.z = nextZ
      npc.userData.baseY = THREE.MathUtils.lerp(npc.userData.baseY, nextGround, Math.min(1, delta * 7))
    } else {
      npc.userData.nextDecision = now
    }
    const targetYaw = Math.atan2(dx, dz)
    const yawDelta = Math.atan2(Math.sin(targetYaw - npc.rotation.y), Math.cos(targetYaw - npc.rotation.y))
    npc.rotation.y += yawDelta * Math.min(1, delta * 6)
  } else {
    if (npc.userData.state === 'socialize' && !npc.userData.hasSpoken) {
      const partner = avatars.get(npc.userData.partnerId)
      speakNpc(npc, partner ? `${partner.userData.name}, תחרות לעוגה?` : worldRemarks[0])
      if (partner && !partner.userData.speechBubble.visible) speakNpc(partner, 'יאללה!')
      npc.userData.hasSpoken = true
    } else if (npc.userData.state === 'explore-party' && !npc.userData.hasSpoken) {
      speakNpc(npc, worldRemarks[Math.floor(Math.random() * worldRemarks.length)])
      npc.userData.hasSpoken = true
    }
  }

  if (npc.userData.speechUntil < now) {
    ;(npc.userData.speechBubble as THREE.Sprite).visible = false
    const arms = npc.userData.arms as THREE.Mesh[]
    if (arms[0]) arms[0].rotation.z += (0 - arms[0].rotation.z) * Math.min(1, delta * 8)
  }
}

function getFocusedNpc() {
  if (!gameActive) return null
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  const hit = raycaster.intersectObjects(npcTargets, false).find((intersection) => intersection.distance <= 6)
  if (hit) return avatars.get((hit.object as THREE.Mesh).userData.npcId) || null
  let nearest: THREE.Group | null = null
  let nearestDistance = 3.1
  avatars.forEach((npc) => {
    const distance = distance2D(npc.position, camera.position)
    if (distance < nearestDistance) { nearest = npc; nearestDistance = distance }
  })
  return nearest
}

function interactWithNpc() {
  const npc = getFocusedNpc()
  if (!npc) return showToast('התקרבו לחבר או לחברה והביטו בהם כדי לדבר')
  const responses = ['אני איתך — לאן הולכים?', 'הגיע הזמן להרפתקת יום הולדת!', 'מה אנחנו בונים?', 'לאן ממשיכים, קפטן יאיר?']
  speakNpc(npc, responses[Math.floor(Math.random() * responses.length)], 4200)
  npc.userData.followUntil = performance.now() + 14000
  npc.userData.nextDecision = npc.userData.followUntil
  showToast(`${npc.userData.name} הולך או הולכת אחריך`)
  playSfx(270)
}

savedFriends.forEach(makeAvatar)
renderPeople()

// --- Portrait studio -------------------------------------------------------
function setCreator(open: boolean) {
  creatorPanel.classList.toggle('open', open)
  if (!open) stopCamera()
  if (open) {
    gameActive = false
    if (controls.isLocked) controls.unlock()
    welcomeCard.classList.add('hidden')
    setTimeout(() => friendName.focus(), 350)
  }
}

function setPortrait(dataUrl: string) {
  pendingPortrait = dataUrl
  portraitPreview.innerHTML = `<img src="${pendingPortrait}" alt="תצוגה מקדימה של התמונה">`
  $('#mini-face').innerHTML = `<img src="${pendingPortrait}" alt="">`
  $('#portrait-drop').classList.add('has-photo')
}

function cropPortrait(file: File) {
  if (!file.type.startsWith('image/')) return showToast('יש לבחור קובץ תמונה')
  if (file.size > 8_000_000) return showToast('התמונה גדולה מדי — עד 8MB')
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const tiny = document.createElement('canvas')
      tiny.width = tiny.height = 48
      const ctx = tiny.getContext('2d')!
      const side = Math.min(image.width, image.height)
      ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 48, 48)
      setPortrait(tiny.toDataURL('image/jpeg', 0.86))
    }
    image.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

function stopCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop())
  cameraStream = null
  cameraVideo.srcObject = null
  $('#portrait-drop').classList.remove('camera-active')
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraInput.click()
    return
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false,
    })
    cameraVideo.srcObject = cameraStream
    $('#portrait-drop').classList.add('camera-active')
    await cameraVideo.play()
  } catch {
    stopCamera()
    showToast('המצלמה אינה זמינה — בדקו הרשאה או בחרו תמונה')
  }
}

function captureCamera() {
  if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return showToast('המצלמה עדיין מופעלת')
  const tiny = document.createElement('canvas')
  tiny.width = tiny.height = 48
  const ctx = tiny.getContext('2d')!
  const side = Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight)
  const sourceX = (cameraVideo.videoWidth - side) / 2
  const sourceY = (cameraVideo.videoHeight - side) / 2
  ctx.translate(48, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(cameraVideo, sourceX, sourceY, side, side, 0, 0, 48, 48)
  setPortrait(tiny.toDataURL('image/jpeg', 0.88))
  stopCamera()
  showToast('התמונה צולמה')
}

$('#portrait-drop').addEventListener('click', (event) => {
  if (!(event.target as HTMLElement).closest('button, video') && !$('#portrait-drop').classList.contains('camera-active')) portraitInput.click()
})
$('#change-photo').addEventListener('click', (event) => { event.stopPropagation(); portraitInput.click() })
$('#choose-photo').addEventListener('click', () => portraitInput.click())
$('#open-camera').addEventListener('click', startCamera)
$('#capture-camera').addEventListener('click', (event) => { event.stopPropagation(); captureCamera() })
$('#cancel-camera').addEventListener('click', (event) => { event.stopPropagation(); stopCamera() })
portraitInput.addEventListener('change', () => { if (portraitInput.files?.[0]) cropPortrait(portraitInput.files[0]) })
cameraInput.addEventListener('change', () => { if (cameraInput.files?.[0]) cropPortrait(cameraInput.files[0]) })
;['dragenter', 'dragover'].forEach((type) => $('#portrait-drop').addEventListener(type, (event) => { event.preventDefault(); $('#portrait-drop').classList.add('dragging') }))
;['dragleave', 'drop'].forEach((type) => $('#portrait-drop').addEventListener(type, (event) => { event.preventDefault(); $('#portrait-drop').classList.remove('dragging') }))
$('#portrait-drop').addEventListener('drop', (event) => { const file = (event as DragEvent).dataTransfer?.files[0]; if (file) cropPortrait(file) })

$('#swatches').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.swatch')
  if (!button) return
  $('.swatch.active')?.classList.remove('active')
  button.classList.add('active')
  shirtColor = button.dataset.color || shirtColor
  $('#mini-avatar').style.setProperty('--shirt-color', shirtColor)
})

$('#spawn-button').addEventListener('click', () => {
  const name = friendName.value.trim()
  if (!pendingPortrait) return showToast('קודם צריך להוסיף תמונת פנים')
  if (!name) return showToast('צריך לתת לדמות שם')
  if (savedFriends.length >= 8) return showToast('העולם מלא — אפשר להוסיף עד 8 חברים')
  const friend: SavedFriend = { id: crypto.randomUUID(), name, portrait: pendingPortrait, color: shirtColor }
  savedFriends.push(friend)
  persistFriends()
  makeAvatar(friend, savedFriends.length - 1)
  renderPeople()
  setCreator(false)
  friendName.value = ''
  pendingPortrait = ''
  portraitPreview.innerHTML = '<span class="upload-icon">↥</span><strong>גררו לכאן תמונת פנים</strong><small>או לחצו כדי לבחור תמונה</small>'
  $('#mini-face').textContent = ':)'
  $('#portrait-drop').classList.remove('has-photo')
  stopCamera()
  showToast(`${name} הצטרף או הצטרפה לעולם של יאיר`)
})

// --- Game interaction ------------------------------------------------------
const keys = new Set<string>()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
let selectedBlock: BlockType = 'grass'
let onGround = false
let lastTime = performance.now()
let soundEnabled = true
let audioContext: AudioContext | null = null
let gameActive = false
let inventoryOpen = false
let resumeAfterInventory = false
let fallbackLook = false
let draggingLook = false
let dragDistance = 0
let lastPointerX = 0
let lastPointerY = 0
let editRepeatTimer = 0
let currentEyeHeight = 1.7
const raycaster = new THREE.Raycaster()
raycaster.far = 7

function playSfx(frequency: number) {
  if (!soundEnabled) return
  audioContext ||= new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, audioContext.currentTime + 0.07)
  gain.gain.setValueAtTime(0.035, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08)
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.08)
}

function isGameInputActive() {
  return gameActive && !inventoryOpen && !creatorPanel.classList.contains('open') && (controls.isLocked || fallbackLook)
}

function enableFallbackLook() {
  fallbackLook = true
  gameActive = true
  $('#crosshair').classList.add('visible')
  $('#lock-hint').textContent = 'נעילת העכבר אינה זמינה — גררו כדי להביט · אפשר גם עם החיצים'
  $('#lock-hint').classList.add('visible')
  showToast('מצב גרירה למבט הופעל בדפדפן הזה')
}

async function requestGamePointerLock() {
  try {
    await renderer.domElement.requestPointerLock()
  } catch {
    enableFallbackLook()
  }
}

function activateGame() {
  gameActive = true
  welcomeCard.classList.add('hidden')
  renderer.domElement.focus()
  if (fallbackLook) {
    $('#crosshair').classList.add('visible')
    $('#lock-hint').textContent = 'גרירה למבט · WASD לתנועה · E לפתיחת התיק'
    $('#lock-hint').classList.add('visible')
    return
  }
  if (!controls.isLocked) void requestGamePointerLock()
}

function setInventory(open: boolean) {
  if (open === inventoryOpen) return
  if (open) {
    resumeAfterInventory = gameActive
    gameActive = false
    keys.clear()
    if (controls.isLocked) controls.unlock()
  }
  inventoryOpen = open
  inventoryPanel.classList.toggle('open', open)
  inventoryPanel.setAttribute('aria-hidden', String(!open))
  if (open) {
    $('#close-inventory').focus()
  } else if (resumeAfterInventory) {
    resumeAfterInventory = false
    activateGame()
  }
}

function selectBlock(type: BlockType, announce = true) {
  selectedBlock = type
  document.querySelectorAll('.block-slot, [data-inventory-block]').forEach((element) => element.classList.remove('active'))
  document.querySelector<HTMLButtonElement>(`.block-slot[data-block="${type}"]`)?.classList.add('active')
  document.querySelector<HTMLButtonElement>(`[data-inventory-block="${type}"]`)?.classList.add('active')
  const blockNames: Record<BlockType, string> = { grass: 'דשא', dirt: 'אדמה', stone: 'אבן', wood: 'עץ' }
  if (announce) showToast(`נבחרה קוביית ${blockNames[type]}`)
}

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return
  if (event.code === 'KeyF') {
    event.preventDefault()
    interactWithNpc()
    return
  }
  if (event.code === 'KeyE') {
    event.preventDefault()
    setInventory(!inventoryOpen)
    return
  }
  if (event.code === 'Escape' && inventoryOpen) {
    event.preventDefault()
    setInventory(false)
    return
  }
  if (event.code === 'Escape' && fallbackLook) {
    gameActive = false
    draggingLook = false
    keys.clear()
    $('#crosshair').classList.remove('visible')
    $('#lock-hint').textContent = 'לחצו על העולם כדי להמשיך'
    $('#lock-hint').classList.add('visible')
    return
  }
  if (event.code === 'Enter' && !welcomeCard.classList.contains('hidden')) activateGame()
  keys.add(event.code)
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault()
  if (event.code === 'Space' && onGround && isGameInputActive()) { velocity.y = 7.2; onGround = false }
  const digit = Number(event.key)
  if (digit >= 1 && digit <= 4) selectBlock((['grass', 'dirt', 'stone', 'wood'] as BlockType[])[digit - 1])
})
window.addEventListener('keyup', (event) => keys.delete(event.code))
window.addEventListener('blur', () => { keys.clear(); stopEditing() })

function heightAt(x: number, z: number) {
  const bx = Math.round(x)
  const bz = Math.round(z)
  for (let y = 32; y >= -2; y--) {
    const block = blocks.get(keyFor(bx, y, bz))
    if (block && block.userData.type !== 'leaves') return y + 0.5
  }
  return -0.5
}

function collidesAt(x: number, y: number, z: number) {
  const radius = 0.3
  const minX = Math.ceil(x - radius - 0.5)
  const maxX = Math.floor(x + radius + 0.5)
  const minZ = Math.ceil(z - radius - 0.5)
  const maxZ = Math.floor(z + radius + 0.5)
  const feet = y - currentEyeHeight + 0.03
  const head = feet + (currentEyeHeight < 1.5 ? 1.45 : 1.8)
  const minY = Math.ceil(feet - 0.5)
  const maxY = Math.floor(head + 0.5)
  for (let bx = minX; bx <= maxX; bx++) for (let by = minY; by <= maxY; by++) for (let bz = minZ; bz <= maxZ; bz++) {
    const block = blocks.get(keyFor(bx, by, bz))
    if (!block) continue
    if (bx + 0.5 > x - radius && bx - 0.5 < x + radius && by + 0.5 > feet && by - 0.5 < head && bz + 0.5 > z - radius && bz - 0.5 < z + radius) return true
  }
  return false
}

function editBlock(place: boolean) {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  const hit = raycaster.intersectObjects(raycastTargets, false)[0]
  if (!hit) return
  const mesh = hit.object as THREE.Mesh
  if (!place) {
    if (mesh.userData.present && !mesh.userData.opened) {
      mesh.userData.opened = true
      mesh.material = frostingMaterial
      mesh.scale.y = 0.36
      mesh.position.y -= 0.32
      const wishes = ['שנה מלאה בהרפתקאות!', 'עוד עוגה נפתחה!', 'החברים שלך הם האוצר האמיתי!', 'קסם יום הולדת נמצא!']
      showToast(wishes[Math.floor(Math.random() * wishes.length)])
      playSfx(330)
      return
    }
    if (mesh.position.y <= 0) return showToast('אי אפשר להזיז את סלע האם')
    removeBlock(mesh)
    playSfx(118)
    return
  }
  if (!hit.face) return
  const position = mesh.position.clone().add(hit.face.normal)
  const player = camera.position
  if (Math.abs(position.x - player.x) < 0.8 && Math.abs(position.z - player.z) < 0.8 && Math.abs(position.y - (player.y - 1)) < 1.7) return
  addBlock(Math.round(position.x), Math.round(position.y), Math.round(position.z), selectedBlock, true)
  playSfx(176)
}

function pickBlock() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
  const hit = raycaster.intersectObjects(raycastTargets, false)[0]
  const type = (hit?.object as THREE.Mesh | undefined)?.userData.type as BlockType | undefined
  if (type && ['grass', 'dirt', 'stone', 'wood'].includes(type)) selectBlock(type)
}

function stopEditing() {
  window.clearInterval(editRepeatTimer)
  editRepeatTimer = 0
  draggingLook = false
}

renderer.domElement.addEventListener('mousedown', (event) => {
  if (!isGameInputActive()) { activateGame(); return }
  if (event.button === 1) { pickBlock(); return }
  if (event.button === 2 && getFocusedNpc()) { interactWithNpc(); return }
  if (fallbackLook && event.button === 0) {
    draggingLook = true
    dragDistance = 0
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    return
  }
  editBlock(event.button === 2)
  editRepeatTimer = window.setInterval(() => editBlock(event.button === 2), 210)
})
window.addEventListener('mouseup', (event) => {
  if (fallbackLook && draggingLook && event.button === 0 && dragDistance < 4) editBlock(false)
  stopEditing()
})
window.addEventListener('mousemove', (event) => {
  if (!fallbackLook || !draggingLook || !gameActive) return
  const dx = event.clientX - lastPointerX
  const dy = event.clientY - lastPointerY
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  dragDistance += Math.abs(dx) + Math.abs(dy)
  camera.rotation.order = 'YXZ'
  camera.rotation.y -= dx * 0.003
  camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - dy * 0.003, -Math.PI / 2.05, Math.PI / 2.05)
})
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault())
renderer.domElement.addEventListener('wheel', (event) => {
  if (!gameActive) return
  event.preventDefault()
  const types: BlockType[] = ['grass', 'dirt', 'stone', 'wood']
  const next = (types.indexOf(selectedBlock) + (event.deltaY > 0 ? 1 : -1) + types.length) % types.length
  selectBlock(types[next])
}, { passive: false })

document.querySelectorAll<HTMLButtonElement>('.block-slot').forEach((button) => button.addEventListener('click', () => {
  selectBlock(button.dataset.block as BlockType)
}))
document.querySelectorAll<HTMLButtonElement>('[data-inventory-block]').forEach((button) => button.addEventListener('click', () => {
  selectBlock(button.dataset.inventoryBlock as BlockType)
}))
selectBlock('grass', false)

controls.addEventListener('lock', () => {
  gameActive = true
  $('#crosshair').classList.add('visible')
  $('#lock-hint').classList.remove('visible')
})
controls.addEventListener('unlock', () => {
  $('#crosshair').classList.remove('visible')
  if (!inventoryOpen && !creatorPanel.classList.contains('open') && !fallbackLook) {
    gameActive = false
    keys.clear()
    $('#lock-hint').textContent = 'לחצו על העולם כדי להמשיך · E לפתיחת התיק'
    $('#lock-hint').classList.add('visible')
  }
})
document.addEventListener('pointerlockerror', () => {
  enableFallbackLook()
})

function animate(now: number) {
  requestAnimationFrame(animate)
  const delta = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now
  if (isGameInputActive()) {
    velocity.y -= 19 * delta
    direction.z = Number(keys.has('KeyW')) - Number(keys.has('KeyS'))
    direction.x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'))
    direction.normalize()
    const sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const sprinting = keys.has('ControlLeft') || keys.has('ControlRight')
    const speed = sneaking ? 2.25 : sprinting && direction.z > 0 ? 8.4 : 5.2
    currentEyeHeight += ((sneaking ? 1.35 : 1.7) - currentEyeHeight) * Math.min(1, delta * 14)
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const movement = forward.multiplyScalar(direction.z).add(right.multiplyScalar(direction.x))
    if (movement.lengthSq()) movement.normalize().multiplyScalar(speed * delta)
    const previousX = camera.position.x
    camera.position.x += movement.x
    if (collidesAt(camera.position.x, camera.position.y, camera.position.z)) camera.position.x = previousX
    const previousZ = camera.position.z
    camera.position.z += movement.z
    if (collidesAt(camera.position.x, camera.position.y, camera.position.z)) camera.position.z = previousZ
    camera.position.y += velocity.y * delta
    const floor = heightAt(camera.position.x, camera.position.z) + currentEyeHeight
    if (camera.position.y < floor) { camera.position.y = floor; velocity.y = 0; onGround = true }
    const lookSpeed = 1.75 * delta
    if (keys.has('ArrowLeft')) camera.rotation.y += lookSpeed
    if (keys.has('ArrowRight')) camera.rotation.y -= lookSpeed
    if (keys.has('ArrowUp')) camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x + lookSpeed, -Math.PI / 2.05, Math.PI / 2.05)
    if (keys.has('ArrowDown')) camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - lookSpeed, -Math.PI / 2.05, Math.PI / 2.05)
    if (camera.position.y < 1) camera.position.set(0, terrainHeight(0, 0) + 2.3, 7)
  }
  avatars.forEach((avatar) => {
    updateNpc(avatar, now, delta)
    avatar.position.y = avatar.userData.baseY + Math.sin(now * 0.0018 + avatar.userData.phase) * 0.035
    avatar.children.forEach((child, index) => { if (child.userData.limb) child.rotation.x = Math.sin(now * 0.0015 + index) * 0.04 })
  })
  const focusedNpc = getFocusedNpc()
  const npcPrompt = $('#npc-prompt')
  npcPrompt.classList.toggle('visible', Boolean(focusedNpc))
  if (focusedNpc) npcPrompt.querySelector('b')!.textContent = focusedNpc.userData.name.toUpperCase()
  clouds.forEach((cloud, index) => {
    cloud.position.x += delta * (0.32 + index * 0.015)
    if (cloud.position.x > 42) cloud.position.x = -48
  })
  balloons.forEach((balloon) => {
    balloon.position.y = balloon.userData.baseY + Math.sin(now * 0.0015 + balloon.userData.phase) * 0.12
    balloon.rotation.y += delta * 0.25
  })
  candleFlames.forEach((flame, index) => {
    flame.position.y = flame.userData.baseY + Math.sin(now * 0.008 + index) * 0.045
    const flicker = 0.85 + Math.sin(now * 0.013 + index * 2) * 0.15
    flame.scale.set(flicker, 1 + (1 - flicker), flicker)
  })
  const positions = confettiGeometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < confettiCount; i++) {
    positions.setY(i, positions.getY(i) - delta * (0.5 + (i % 5) * 0.12))
    positions.setX(i, positions.getX(i) + Math.sin(now * 0.001 + i) * delta * 0.12)
    if (positions.getY(i) < 3.2) positions.setY(i, 16 + (i % 7) * 0.35)
  }
  positions.needsUpdate = true
  water.material.opacity = 0.68 + Math.sin(now * 0.001) * 0.04
  renderer.render(scene, camera)
}

function resize() {
  const { clientWidth, clientHeight } = worldEl
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(clientWidth, clientHeight, false)
}
window.addEventListener('resize', resize)
resize()
animate(performance.now())

let toastTimer = 0
function showToast(message: string) {
  toast.textContent = message
  toast.classList.add('show')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400)
}

$('#play-button').addEventListener('click', activateGame)
$('#dismiss-welcome').addEventListener('click', () => welcomeCard.classList.add('hidden'))
$('#open-creator').addEventListener('click', () => setCreator(true))
$('#dock-add').addEventListener('click', () => setCreator(true))
$('#close-creator').addEventListener('click', () => setCreator(false))
$('#close-inventory').addEventListener('click', () => setInventory(false))
$('#home-button').addEventListener('click', () => { if (controls.isLocked) controls.unlock(); welcomeCard.classList.remove('hidden') })
$('#sound-button').addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement
  button.classList.toggle('muted')
  soundEnabled = !button.classList.contains('muted')
  button.textContent = button.classList.contains('muted') ? '×' : '♫'
  showToast(button.classList.contains('muted') ? 'הצליל מושתק' : 'הצליל פועל')
  if (soundEnabled) playSfx(240)
})

camera.lookAt(0, 3, 0)
