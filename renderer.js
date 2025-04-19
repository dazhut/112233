// 删除原本的 const { ipcRenderer } = require('electron');

// 使用 localStorage 替代数据库
const PositionStore = {
  save: async (data) => {
    localStorage.setItem('positions', JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }));
    return true;
  },
  load: async () => {
    const data = localStorage.getItem('positions');
    return data ? JSON.parse(data) : null;
  }
};

// 其余代码保持不变（路径点、地图初始化等）
// ...

// 景山公园周围的路径点
const pathPoints = [
  [116.3934, 39.9235], // 景山公园南门
  [116.3938, 39.9238],
  [116.3942, 39.9240],
  [116.3945, 39.9242],
  [116.3948, 39.9245], // 东侧
  [116.3950, 39.9248],
  [116.3952, 39.9250],
  [116.3950, 39.9253],
  [116.3948, 39.9255], // 北侧
  [116.3945, 39.9257],
  [116.3942, 39.9258],
  [116.3938, 39.9259],
  [116.3934, 39.9260], // 北门
  [116.3930, 39.9259],
  [116.3926, 39.9258],
  [116.3923, 39.9257],
  [116.3920, 39.9255], // 西侧
  [116.3918, 39.9253],
  [116.3916, 39.9250],
  [116.3915, 39.9248],
  [116.3913, 39.9245],
  [116.3912, 39.9242], // 南侧
  [116.3915, 39.9240],
  [116.3918, 39.9238],
  [116.3922, 39.9236],
  [116.3926, 39.9235],
  [116.3930, 39.9234]
];

let map;
let runnerIndex = 0;
let chaserIndex = 0;
let gameInterval;
const speed = 0.0002; // 移动速度

// 初始化地图
function initMap() {
  // 确保地图容器有正确尺寸
  const mapContainer = document.getElementById('map');
  mapContainer.style.width = '100%';
  mapContainer.style.height = '100%';
  
  map = new AMap.Map('map', {
    viewMode: '2D',
    zoom: 16,
    center: [116.3934, 39.9235],
    layers: [
      new AMap.TileLayer.Satellite(),
      new AMap.TileLayer.RoadNet()
    ]
  });

  // 添加事件监听
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('saveBtn').addEventListener('click', savePositions);
  document.getElementById('loadBtn').addEventListener('click', loadPositions);
  
  // 初始位置
  updatePosition('runner', pathPoints[runnerIndex]);
  updatePosition('chaser', pathPoints[chaserIndex]);
}

// 开始游戏
function startGame() {
  if (gameInterval) clearInterval(gameInterval);
  
  gameInterval = setInterval(() => {
    // 追逐者移动
    chaserIndex = (chaserIndex + 1) % pathPoints.length;
    updatePosition('chaser', pathPoints[chaserIndex]);
    
    // 逃跑者移动 (比追逐者快一点)
    runnerIndex = (runnerIndex + 2) % pathPoints.length;
    updatePosition('runner', pathPoints[runnerIndex]);
  }, 100);
}

// 更新图片位置
function updatePosition(elementId, lngLat) {
  const pixel = map.lngLatToContainer(new AMap.LngLat(lngLat[0], lngLat[1]));
  const element = document.getElementById(elementId);
  
  // 考虑图片中心点
  const halfWidth = element.offsetWidth / 2;
  const halfHeight = element.offsetHeight / 2;
  
  element.style.left = `${pixel.getX() - halfWidth}px`;
  element.style.top = `${pixel.getY() - halfHeight}px`;
}

// 保存当前位置到数据库
async function savePositions() {
  const runnerPos = pathPoints[runnerIndex];
  const chaserPos = pathPoints[chaserIndex];
  
  try {
    await ipcRenderer.invoke('save-positions', {
      runnerX: runnerPos[0],
      runnerY: runnerPos[1],
      chaserX: chaserPos[0],
      chaserY: chaserPos[1]
    });
    alert('位置已保存');
  } catch (error) {
    console.error('保存位置失败:', error);
    alert('保存位置失败');
  }
}

// 从数据库加载位置
async function loadPositions() {
  try {
    const positions = await ipcRenderer.invoke('load-positions');
    if (positions) {
      // 找到最近的路径点
      runnerIndex = findClosestPointIndex(pathPoints, [positions.runnerX, positions.runnerY]);
      chaserIndex = findClosestPointIndex(pathPoints, [positions.chaserX, positions.chaserY]);
      
      // 更新位置
      updatePosition('runner', pathPoints[runnerIndex]);
      updatePosition('chaser', pathPoints[chaserIndex]);
      alert('位置已加载');
    } else {
      alert('没有找到保存的位置');
    }
  } catch (error) {
    console.error('加载位置失败:', error);
    alert('加载位置失败');
  }
}

// 找到最近的路径点索引
function findClosestPointIndex(points, target) {
  let minDist = Infinity;
  let closestIndex = 0;
  
  points.forEach((point, index) => {
    const dist = Math.sqrt(
      Math.pow(point[0] - target[0], 2) + 
      Math.pow(point[1] - target[1], 2)
    );
    
    if (dist < minDist) {
      minDist = dist;
      closestIndex = index;
    }
  });
  
  return closestIndex;
}

// 初始化
document.addEventListener('DOMContentLoaded', initMap);
