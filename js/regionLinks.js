// 生成区域链接的函数
function generateRegionLink(region, service) {
    return `/top-${service}-services-in-${region}`;
}

// 导出函数供其他文件使用
window.generateRegionLink = generateRegionLink; 