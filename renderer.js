// 景山公园路径点数据
const pathPoints = [
  [116.3934, 39.9235], [116.3938, 39.9238], [116.3942, 39.9240],
  [116.3945, 39.9242], [116.3948, 39.9245], [116.3950, 39.9248],
  [116.3952, 39.9250], [116.3950, 39.9253], [116.3948, 39.9255],
  [116.3945, 39.9257], [116.3942, 39.9258], [116.3938, 39.9259],
  [116.3934, 39.9260], [116.3930, 39.9259], [116.3926, 39.9258],
  [116.3923, 39.9257], [116.3920, 39.9255], [116.3918, 39.9253],
  [116.3916, 39.9250], [116.3915, 39.9248], [116.3913, 39.9245],
  [116.3912, 39.9242], [116.3915, 39.9240], [116.3918, 39.9238],
  [116.3922, 39.9236], [116.3926, 39.9235], [116.3930, 39.9234]
];

// 游戏状态
const gameState = {
  map: null,
  runnerIndex: 0,
  chaserIndex: 0,
  gameInterval: null,
  isPaused: false,
  speeds: {
    runner: 2,  // 逃跑者每次移动2个点
    chaser: 1   // 追逐者每次移动1个点
  }
};

// 初始化地图
function initMap() {
  const mapContainer = document.getElementById('map');
  mapContainer.style.width = '100%';
  mapContainer.style.height = '100%';

  gameState.map = new AMap.Map('map', {
    viewMode: '2D',
    zoom: 16,
    center: [116.3934, 39.9235],
    layers: [
      new AMap.TileLayer.Satellite(),
      new AMap.TileLayer.RoadNet()
    ],
    showIndoorMap: false,
    dragEnable: true,
    zoomEnable: true,
    doubleClickZoom: true
  });

  // 初始化事件监听
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('saveBtn').addEventListener('click', savePositions);
  document.getElementById('loadBtn').addEventListener('click', loadPositions);

  // 初始位置
  updatePosition('runner', pathPoints[gameState.runnerIndex]);
  updatePosition('chaser', pathPoints[gameState.chaserIndex]);
}

// 开始游戏
function startGame() {
  if (gameState.gameInterval) {
    clearInterval(gameState.gameInterval);
  }
  
  gameState.isPaused = false;
  document.getElementById('pauseBtn').textContent = '暂停';
  
  gameState.gameInterval = setInterval(() => {
    if (!gameState.isPaused) {
      // 追逐者移动
      gameState.chaserIndex = (gameState.chaserIndex + gameState.speeds.chaser) % pathPoints.length;
      updatePosition('chaser', pathPoints[gameState.chaserIndex]);
      
      // 逃跑者移动
      gameState.runnerIndex = (gameState.runnerIndex + gameState.speeds.runner) % pathPoints.length;
      updatePosition('runner', pathPoints[gameState.runnerIndex]);
      
      // 检查是否抓到
      if (gameState.chaserIndex === gameState.runnerIndex) {
        alert('抓到啦！游戏结束');
        clearInterval(gameState.gameInterval);
      }
    }
  }, 200);
}

// 暂停/继续游戏
function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  document.getElementById('pauseBtn').textContent = gameState.isPaused ? '继续' : '暂停';
}

// 更新元素位置
function updatePosition(elementId, lngLat) {
  const pixel = gameState.map.lngLatToContainer(new AMap.LngLat(lngLat[0], lngLat[1]));
  const element = document.getElementById(elementId);
  
  // 考虑元素中心点
  const halfWidth = element.offsetWidth / 2;
  const halfHeight = element.offsetHeight / 2;
  
  element.style.left = `${pixel.getX() - halfWidth}px`;
  element.style.top = `${pixel.getY() - halfHeight}px`;
}

// 保存当前位置
function savePositions() {
  const positions = {
    runnerX: pathPoints[gameState.runnerIndex][0],
    runnerY: pathPoints[gameState.runnerIndex][1],
    chaserX: pathPoints[gameState.chaserIndex][0],
    chaserY: pathPoints[gameState.chaserIndex][1],
    timestamp: new Date().toISOString()
  };
  
  try {
    localStorage.setItem('gamePositions', JSON.stringify(positions));
    showMessage('位置已保存');
  } catch (e) {
    showMessage('保存失败: ' + e.message, true);
  }
}

// 加载保存的位置
function loadPositions() {
  try {
    const data = localStorage.getItem('gamePositions');
    if (data) {
      const positions = JSON.parse(data);
      
      gameState.runnerIndex = findClosestPointIndex(pathPoints, [positions.runnerX, positions.runnerY]);
      gameState.chaserIndex = findClosestPointIndex(pathPoints, [positions.chaserX, positions.chaserY]);
      
      updatePosition('runner', pathPoints[gameState.runnerIndex]);
      updatePosition('chaser', pathPoints[gameState.chaserIndex]);
      showMessage('位置已加载');
    } else {
      showMessage('没有找到保存的位置', true);
    }
  } catch (e) {
    showMessage('加载失败: ' + e.message, true);
  }
}

// 找到最近的路径点
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

// 显示临时消息
function showMessage(msg, isError = false) {
  const msgBox = document.createElement('div');
  msgBox.textContent = msg;
  msgBox.style.position = 'fixed';
  msgBox.style.top = '20px';
  msgBox.style.left = '50%';
  msgBox.style.transform = 'translateX(-50%)';
  msgBox.style.padding = '10px 20px';
  msgBox.style.background = isError ? '#e74c3c' : '#2ecc71';
  msgBox.style.color = 'white';
  msgBox.style.borderRadius = '5px';
  msgBox.style.zIndex = '2000';
  msgBox.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  
  document.body.appendChild(msgBox);
  
  setTimeout(() => {
    msgBox.style.opacity = '0';
    msgBox.style.transition = 'opacity 0.5s';
    setTimeout(() => msgBox.remove(), 500);
  }, 2000);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initMap);
